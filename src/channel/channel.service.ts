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
import { ChannelDMs } from './entities/channelDMs.entity';
import { chatRoomListDTO } from './dto/chatBackEnd.dto';

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
    // TypeORM의 QueryBuilder를 사용하여 채널 정보와 함께 게임 정보도 함께 조회
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.game', 'game') // "game"은 channel 엔티티 내에서 게임 엔티티와 연결된 필드명이어야 합니다.
      .getMany();

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

    const url = `http://chunsik.store:3000/channel/accept?code=${uuid}`;

    return url;
  }

  // 링크를 해독하여 user와 channel id를 추출, 멤버 생성 함수로 연결

  async getUserIdAndChannelIdFromLink(uuid: string) {
    const Info = await this.redis.get(`randomKey:${uuid}`);
    const userId = +Info.split('_')[0];
    const channelId = +Info.split('_')[1];
    await this.createMember(userId, channelId);
  }

  // 링크 클릭 시 멤버 생성
  async createMember(userId: number, channelId: number) {
    const existingMember = await this.channelMemberRepository.findOne({ where: { userId, channelId } });
    if (existingMember) {
      throw new NotFoundException('이미 채널에 있는 유저입니다.');
    }
    const newMember = this.channelMemberRepository.create({
      role: MemberRole.User,
      userId: +userId,
      channelId: +channelId,
    });

    if (!newMember) throw new NotFoundException('존재하지 않는 user입니다.');
    await this.channelMemberRepository.save(newMember);
    // 채팅방에도 추가
    const channelChats = await this.channelChatRepository.find({ where: { channelId } });

    await Promise.all(
      channelChats.map(async chat => {
        chat.channelMemberId.push(newMember.userId);
        await this.channelChatRepository.save(chat);
      }),
    );

    return newMember;
  }

  //chat
  async createChat(channelId: number, createChatDto: CreateChatDto) {
    const { title, chatType, maximumPeople } = createChatDto;
    const channel = await this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const chatMembers = await this.channelMemberRepository.find({ where: { channelId } });
    const memberIds = chatMembers.map(member => member.userId);

    const chat = this.channelChatRepository.create({
      channelMemberId: memberIds,
      channelId: +channelId,
      title,
      chatType,
      maximumPeople,
    });

    const savedchat = await this.channelChatRepository.save(chat);
    console.log('ChannelService ~ createChat ~ savedchat:', savedchat);
    return chat;
  }

  async findAllChat(id: number) {
    const chat = await this.channelChatRepository.find({
      where: { channel: { id } },
    });
    return chat;
  }

  async findOneChat(title: string) {
    const sameTitle = await this.channelChatRepository.findOne({ where: { title } });

    return sameTitle;
  }
  async deleteChat(channelId: number, chatId: number) {
    const channel = await this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const chat = await this.channelChatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('존재하지 않는 채팅입니다.');

    await this.channelChatRepository.remove(chat);
  }
}
