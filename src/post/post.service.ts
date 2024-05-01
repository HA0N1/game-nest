import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/type/post.type';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';
import { User } from 'src/user/entities/user.entity';
import { Like } from 'src/user/entities/like.entity';

@Injectable()
export class PostService {
  @InjectRepository(Post)
  private postRepository: Repository<Post>;
  constructor(
    private readonly awsService: AwsService,
    @InjectRepository(File) private fileRepository: Repository<File>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Like) private likeRepository: Repository<Like>,
  ) {}

  //게시글 작성
  async create(userId: number, createPostDto: CreatePostDto, file: Express.Multer.File) {
    const { title, content, category } = createPostDto;
    if (!category) {
      throw new BadRequestException('카테고리를 입력해주세요.');
    }
    if (file) {
      const imagename = this.awsService.getUUID();
      const ext = file.originalname.split('.').pop();
      const imageUrl = await this.awsService.imageUploadToS3(`${imagename}.${ext}`, file, ext);

      const filePath = await this.fileRepository.save({ filePath: imageUrl });
      const postimage = await this.postRepository.save({
        title,
        content,
        category,
        view_count: 0,
        file: filePath,
        user: { id: userId },
      });
      return { message: '게시글이 생성되었습니다.', postimage };
    }
    const post = await this.postRepository.save({
      title,
      content,
      category,
      view_count: 0,
      user: { id: userId },
    });
    return { message: '게시글이 생성되었습니다.', post };
  }

  //게시글 전체 조회
  async findAll(userId: number) {
    const posts = await this.postRepository.find({ order: { id: 'DESC' }, relations: ['file'] });
    if (!posts) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    for (const post of posts) {
      const liked = await this.isLikedByUser(userId, post.id);
      post.liked = liked;
    }

    return posts;
  }

  //게시글 카테고리별 조회
  async findCategory(category: Category) {
    const post = await this.postRepository.find({ where: { category }, relations: ['file'] });
    if (!post) {
      throw new NotFoundException('해당 카테고리의 게시글을 찾을 수 없습니다.');
    }
    return post;
  }

  //게시글 상세 조회
  async findOne(id: number) {
    console.log(id);
    const post = await this.postRepository.findOne({ where: { id }, relations: ['file', 'user'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const liked = await this.isLikedByUser(1, id);
    post.liked = liked;
    post.view_count++;
    await this.postRepository.save(post);

    return post;
  }

  //게시글 수정
  async update(userId: number, id: number, updatePostDto: UpdatePostDto, file: Express.Multer.File) {
    const post = await this.postRepository.findOne({ where: { id }, relations: ['file', 'user'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    if (post.user.id !== userId) {
      throw new UnauthorizedException('게시글을 수정할 수 있는 권한이 없습니다.');
    }
    const { title, content, category } = updatePostDto;
    post.title = title;
    post.content = content;
    post.category = category;
    if (file) {
      const imagename = this.awsService.getUUID();
      const ext = file.originalname.split('.').pop();
      const imageUrl = await this.awsService.imageUploadToS3(`${imagename}.${ext}`, file, ext);

      if (imageUrl) {
        if (post.file) {
          post.file.filePath = imageUrl;
          const updatefile = await this.fileRepository.save({ filePath: imageUrl });
          post.file = updatefile;
        } else {
          const newFile = await this.fileRepository.save({ filePath: imageUrl });
          post.file = newFile;
        }
      }
    }
    const updatedPost = await this.postRepository.save(post);
    return { message: '게시글이 수정되었습니다.', updatedPost };
  }

  //게시글 삭제
  async remove(userId: number, id: number) {
    const post = await this.postRepository.findOne({ where: { id }, relations: ['user'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    if (post.user.id !== userId) {
      throw new UnauthorizedException('게시글을 삭제할 수 있는 권한이 없습니다.');
    }
    await this.postRepository.remove(post);
    return { message: '게시글이 삭제되었습니다' };
  }

  //게시글 좋아요
  async likePost(userId: number, id: number) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['like'] });
    const post = await this.postRepository.findOne({ where: { id } });

    if (!user || !post) {
      throw new NotFoundException('사용자 또는 게시물을 찾을 수 없습니다.');
    }

    const alreadyLikedPosts = await this.likeRepository.findOne({ where: { user: { id: userId }, post: { id } } });
    if (alreadyLikedPosts) {
      throw new BadRequestException('이미 좋아요를 누른 게시글입니다.');
    }

    const like = this.likeRepository.create({ user, post });
    await this.likeRepository.save(like);

    post.likes++;
    post.liked = true;
    await this.postRepository.save(post);

    return { message: '게시글에 좋아요를 추가했습니다.' };
  }

  //게시글 좋아요 취소
  async unlikePost(userId: number, id: number) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['like'] });
    const post = await this.postRepository.findOne({ where: { id } });

    if (!user || !post) {
      throw new NotFoundException('사용자 또는 게시물을 찾을 수 없습니다.');
    }

    const likePost = await this.likeRepository.findOne({ where: { user: { id: userId }, post: { id } } });
    if (!likePost) {
      throw new BadRequestException('좋아요를 취소할 게시글을 찾을 수 없습니다.');
    }

    await this.userRepository.save(user);

    if (post.likes > 0) {
      post.likes--;
    }
    post.liked = false;
    await this.postRepository.save(post);
    await this.likeRepository.remove(likePost);

    return { message: '게시글에 대한 좋아요를 취소했습니다.' };
  }

  //게시글 좋아요 확인
  async isLikedByUser(userId: number, id: number) {
    const post = await this.postRepository.findOne({ where: { id }, relations: ['like'] });
    const like = await this.likeRepository.findOne({ where: { user: { id: userId }, post: { id } } });
    const liked = !!like;
    return post.liked, liked;
  }
}
