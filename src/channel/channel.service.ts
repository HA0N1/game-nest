import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChannelMember } from './entities/channelMember.entity';
import { ChannelChat } from './entities/channelChat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { User } from 'src/user/entities/user.entity';
import { MemberRole } from './type/MemberRole.type';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

import { EventGateway } from 'src/event/event.gateway';
import { ChannelDMs } from './entities/channelDMs.entity';
@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelChat)
    private channelChatRepository: Repository<ChannelChat>,
    @InjectRepository(ChannelDMs)
    private channelDMsRepository: Repository<ChannelDMs>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // 채널 생성
  async createChannel(userId: number, createChannelDto: CreateChannelDto) {
    const { name, gameId } = createChannelDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const channel = await this.channelRepository.findOneBy({ name });

      if (channel) throw new BadRequestException('이미 존재하는 채널명입니다.');

      const newChannel = await this.channelRepository.save(createChannelDto);

      const user = await this.userRepository.findOneBy({ id: userId });

      const newMember = this.channelMemberRepository.create({
        role: MemberRole.Admin,
        user: user,
        channel: newChannel,
      });

      await this.channelMemberRepository.save(newMember);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // 채널 전체 조회
  async findAllChannel() {
    const channels = await this.channelRepository.find();
    return channels;
  }
  // 채널 상세 조회
  async findOneChannel(id: number) {
    const channel = await this.ChannelfindById(id);
    return channel;
  }

  // TODO: 관리자 넘기기
  // 채널 수정
  async updateChannel(userId: number, id: number, updateChannelDto: UpdateChannelDto) {
    const { name } = updateChannelDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const channel = await this.ChannelfindById(id);
      console.log('ChannelService ~ updateChannel ~ channel:', channel);

      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

      const channelMembers = await this.channelMemberRepository.find({
        where: { channel: { id } }, // 채널 테이블
        relations: ['user', 'channel'], // 사용자 정보를 가져오기 위해 관계 로드
      });

      const channelMember = channelMembers.find(member => member.user.id === userId && member.role === 'admin');

      if (!channelMember) throw new UnauthorizedException('권한이 없습니다.');

      await this.channelRepository.update({ id }, { name });
      const updatedChannel = await this.ChannelfindById(id);

      await queryRunner.commitTransaction();
      return updatedChannel;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
  // 채널 삭제
  // TODO: 채널 수정에서 관리자가 변경 되었어도 삭제가 되게 해야함
  async deleteChannel(userId: number, id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const channel = await this.ChannelfindById(id);
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
      const channelMembers = await this.channelMemberRepository.find({
        where: { channel: { id } },
        relations: ['user', 'channel'],
      });

      const channelMember = channelMembers.find(member => member.user.id === userId && member.role === 'admin');

      if (!channelMember) throw new UnauthorizedException('권한이 없습니다.');

      // 멤버 삭제
      await this.channelMemberRepository.delete({ channel });
      // await this.channelMemberRepository
      //   .createQueryBuilder()
      //   .delete()
      //   .from(ChannelMember)
      //   .where('id = :id', { id })
      //   .execute();

      await this.channelRepository.delete(id);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async ChannelfindById(id: number) {
    return await this.channelRepository.findOne({ where: { id } });
  }

  // 멤버 초대 링크 발급
  async linkToInvite(channelId: number, email: string) {
    /**
     * 이메일을 받은 뒤 매칭되는 유저 id가져오기
     * 랜덤 스트링 키에 user와 channel 아이디 값 넣어주기
     * 수락 링크에는 매개변수로 랜덤 스트링을 넣어 주기
     */
    const user = await this.userRepository.findOne({ where: { email }, select: ['id'] });
    const uuid = crypto.randomUUID();
    const userIdAndChannelId = `${user.id}_${channelId}`;
    await this.redis.set(`randomKey:${uuid}`, userIdAndChannelId);

    const url = `http://localhost:3000/channel/accept?code=${uuid}`;

    return url;
  }

  // 링크를 해독하여 user와 channel id를 추출, 멤버 생성 함수로 연결

  async getUserIdAndChannelIdFromLink(uuid: string) {
    const Info = await this.redis.get(`randomKey:${uuid}`);
    const userId = +Info.split('_')[0];
    const channelId = +Info.split('_')[1];
    await this.createMember(userId, channelId);
  }

  // TODO: 호출 형식 여쭤보기
  // 링크 클릭 시 멤버 생성
  async createMember(user: number, channel: number) {
    const newMember = this.channelMemberRepository.create({
      role: MemberRole.User,
      user: user,
      channel: channel,
    } as any);

    await this.channelMemberRepository.save(newMember);
    return newMember;
  }

  //chat
  async createChat(userId: number, channelId: number, createChatDto: CreateChatDto) {
    const { title, chatType, maximumPeople = 8 } = createChatDto;
    const channel = await this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const chat = this.channelChatRepository.create({
      channel: channelId,
      title,
      chatType,
      maximumPeople,
    } as any);
    const savedchat = await this.channelChatRepository.save(chat);
    console.log('ChannelService ~ createChat ~ savedchat:', savedchat);
    // const channelWithUser = await this.channelChatRepository.findOne({where:{id:savedchat.id}})
    // this.eventGateway.server.to(`/ws-${}`)
    return chat;
  }

  async deleteChat(channelId: number, chatId: number) {
    const channel = await this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const chat = await this.channelChatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('존재하지 않는 채팅입니다.');

    await this.channelChatRepository.remove(chat);
  }

  // socket.io로 메시지 전송
  /**
   * 채널과 채팅방이 존재하는지 확인 후 채팅방에 message을 넣어야함.
   *
   * chatId, senderId, content를 저장.
   *
   */
  async saveMessage(channelId: number, chatId: number, senderId: number, content: string) {
    const channel = this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
    const newMessage = new ChannelDMs();
    newMessage.sender_id = +senderId;
    newMessage.content = content;
    newMessage.channel_chat_id = +chatId;
    // const newMessage = this.channelDMsRepository.create({
    //   content,
    //   user: senderId,
    //   channelChat: { id: ChatId },
    // } as any);

    // const a = this.eventGateway.server.to(`${chatId}`).emit('message', { chatId, content });
    const a = await this.channelDMsRepository.save(newMessage);
    console.log('aaaaaaaaaaaaaaa', a);
    return a;
  }

  async getMessagesForChannel(channelId: number): Promise<ChannelDMs[]> {
    // Assuming you want to fetch messages for a specific channel
    return this.channelDMsRepository.find({
      where: {
        channelChat: { channel: { id: channelId } },
      },
      order: { createdAt: 'ASC' }, // Order by createdAt ASC or DESC as needed
    });
  }
}
