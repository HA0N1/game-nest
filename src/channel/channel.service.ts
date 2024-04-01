import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChannelService {
  constructor(@InjectRepository(Channel)
  private channelRepository : Repository<Channel>){}

  async createChannel(createChannelDto: CreateChannelDto) {
    const {name, gameId} = createChannelDto
    const channel = await this.channelRepository.findOneBy({name})

    if(channel) throw new BadRequestException('이미 존재하는 채널명입니다.')
    return channel;
  }

  findAll() {
    return `This action returns all channel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channel`;
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }
}
