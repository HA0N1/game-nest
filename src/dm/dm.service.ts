import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { User } from 'src/user/entities/user.entity';
import { Friendship } from 'src/friend/entities/friendship.entity';
import _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FriendDMs } from './entities/friendDMs.entity';
import { DMRoom } from './entities/DM-room.entity';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';

@Injectable()
export class DMService {
  constructor(
    @InjectRepository(FriendDMs)
    private friendDMsRepository: Repository<FriendDMs>,
    @InjectRepository(DMRoom)
    private dmRoomRepository: Repository<DMRoom>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    private readonly awsService: AwsService,
    @InjectRepository(File) private fileRepository: Repository<File>,
  ) {}

  /* friendshipId로 디엠 방 생성 함수 */
  async createDMRoom(userId: number, friendshipId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });

    // 해당 friendshipId에 userId가 포함되어있는지 확인
    const resistFriend = await this.friendshipRepository
      .createQueryBuilder('fs')
      .select(['fs.id', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .leftJoin('fs.user', 'us')
      .leftJoin('fs.friend', 'fr')
      .where('fs.id=:id', { id: friendshipId })
      .getRawOne();

    if (!(resistFriend.us_id === userId || resistFriend.fr_id == userId)) {
      throw new BadRequestException('본인이 포함된 friendshipId를 작성해야 합니다.');
    }

    const friendship = await this.friendshipRepository.findOneBy({ id: friendshipId });

    // 이미 디엠방이 존재하는지 확인
    const resistDmRoom = await this.dmRoomRepository.findOneBy({ friendship });

    if (resistDmRoom) {
      return { message: 'DMRoom이 이미 존재합니다.', dmRoomId: resistDmRoom.id };
    }

    // friendshipId로 dmRoom 생성
    const dmRoom = await this.dmRoomRepository.save({
      friendship,
    });

    return { message: 'DMroom을 생성했습니다.', dmRoomId: dmRoom.id };
  }

  /* userId로 디엠 방 전체 조회 */
  async getDMRooms(userId: number) {
    return await this.dmRoomRepository
      .createQueryBuilder('dmRoom')
      .select(['dmRoom.id', 'fs.id', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .where('us.id = :id', { id: userId })
      .orWhere('fr.id = :id', { id: userId })
      .leftJoin('dmRoom.friendship', 'fs')
      .leftJoin('fs.user', 'us')
      .leftJoin('fs.friend', 'fr')
      .getRawMany();
  }

  /* dmroomId로 디엠 상세 조회*/
  // 디엠 내역들 조회하는 함수
  async findDMRoom(userId: number, dmRoomId: number) {
    const checkDmRoom = await this.dmRoomRepository
      .createQueryBuilder('dmRoom')
      .select(['dmRoom.id', 'fs.id', 'us.id', 'us.nickname', 'fr.id', 'fr.nickname'])
      .where('dmroom.id = :id', { id: dmRoomId })
      .leftJoin('dmRoom.friendship', 'fs')
      .leftJoin('fs.user', 'us')
      .leftJoin('fs.friend', 'fr')
      .getRawOne();

    if (!(checkDmRoom.us_id === userId || checkDmRoom.fr_id === userId)) {
      throw new BadRequestException('본인이 소속된 디엠방만 조회할 수 있습니다.');
    }

    return checkDmRoom;
  }

  /* 텍스트 채팅 저장 */
  async saveDM(dmRoomId: number, senderId: number, content: string) {
    const sender = await this.userRepository.findOneBy({ id: senderId });

    if (!sender) {
      throw new NotFoundException('조회되지 않는 사용자입니다.');
    }

    const dmRoom = await this.dmRoomRepository.findOneBy({ id: dmRoomId });

    if (!dmRoom) {
      throw new NotFoundException('존재하지 않는 디엠방입니다.');
    }

    const newMessage = await this.friendDMsRepository.save({
      content,
      user: sender,
      DMRoom: dmRoom,
    });
  }

  /* 파일 저장 */
  async sendFile(dmRoomId: number, userId: number, file: Express.Multer.File) {
    const sender = await this.userRepository.findOneBy({ id: userId });

    if (!sender) {
      throw new NotFoundException('조회되지 않는 사용자입니다.');
    }

    const dmRoom = await this.dmRoomRepository.findOneBy({ id: dmRoomId });

    if (!dmRoom) {
      throw new NotFoundException('존재하지 않는 디엠방입니다.');
    }

    const imageName = this.awsService.getUUID();
    const ext = file.originalname.split('.').pop();
    const fileName = `${imageName}.${ext}`;
    const imageUrl = `https://s3.${process.env.AWS_S3_REGION}.amazonaws.com/${process.env.AWS_S3_BUCKET_NAME}/${fileName}`;
    const newImageUrl = await this.awsService.imageUploadToS3(fileName, file, ext);

    const filePath = await this.fileRepository.save({ filePath: newImageUrl });

    const newMessage = await this.friendDMsRepository.save({
      user: sender,
      DMRoom: dmRoom,
      file: filePath,
    });

    return { filePath: imageUrl };
  }

  /* 채팅 내역 보내기 */
  async textHistory(dmRoomId: number, page: number = 1) {
    const existDmRoom = await this.dmRoomRepository.findOneBy({ id: dmRoomId });
    if (!existDmRoom) {
      throw new NotFoundException('존재하지 않는 디엠방입니다.');
    }
    const take = 5;

    //TODO 디엠 내역 페이지네이션
    const dms = await this.friendDMsRepository
      .createQueryBuilder('chat')
      .select(['us.nickname', 'chat.content', 'file.file_path', 'chat.createdAt'])
      .where('room.id = :dmRoomId', { dmRoomId: dmRoomId })
      .leftJoin('chat.user', 'us')
      .leftJoin('chat.DMRoom', 'room')
      .leftJoin('chat.file', 'file')
      .orderBy('chat.created_at', 'ASC')
      .take(take)
      .skip((page - 1) * take)
      .getRawMany();

    return dms;
  }

  /* 디엠 삭제 */
  async deleteRoom(userId: number, dmRoomId: number) {
    // 본인이 소속된 방인지 확인
    // const check = await this.dmRoomRepository.createQueryBuilder().select().where
    // dmRoom 삭제
  }
}
