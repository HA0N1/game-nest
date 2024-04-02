import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelChat)
    private channelChatRepository: Repository<ChannelChat>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
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

      await this.channelRepository.save(createChannelDto);
      const user = await this.userRepository.findOneBy({ id: userId });
      const newMember = this.channelMemberRepository.create({
        role: MemberRole.Admin,
        user: user,
        channel: channel,
      });

      await this.channelMemberRepository.save(newMember);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
  async updateChannel(id: number, updateChannelDto: UpdateChannelDto) {
    const { name } = updateChannelDto;
    const channel = await this.ChannelfindById(id);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
    await this.channelRepository.update({ id }, { name });
    const updatedChannel = await this.ChannelfindById(id);
    return updatedChannel;
  }
  // 채널 삭제
  async deleteChannel(id: number) {
    const channel = await this.ChannelfindById(id);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    // const user = await this.channelMemberRepository.findOne({where: {userId}})
    // if(user.id !== userId) throw new ForbiddenException('삭제할 권한이 없습니다.');

    await this.channelRepository.delete(id);
  }

  async ChannelfindById(id: number) {
    return await this.channelRepository.findOne({ where: { id } });
  }
  // 멤버 초대
  async;
  // 초대 수락
  //chat
  async createChat(id: number, createChatDto: CreateChatDto) {
    const { title, chatType, maximumPeople = 8 } = createChatDto;
    const channel = await this.ChannelfindById(id);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
    const chat = await this.channelChatRepository.insert({
      id,
      title,
      chatType,
      maximumPeople,
    });
    return chat;
    // await this.channelChatRepository.save(chat);
  }

  async deleteChat(channelId: number, chatId: number) {
    const channel = await this.ChannelfindById(channelId);
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const chat = await this.channelChatRepository.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('존재하지 않는 채팅입니다.');

    await this.channelChatRepository.remove(chat);
  }
}
