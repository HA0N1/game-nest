import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/type/post.type';
import { AwsService } from 'src/aws/aws.service';
import { File } from 'src/aws/entities/file.entity';

@Injectable()
export class PostService {
  @InjectRepository(Post)
  private postRepository: Repository<Post>;
  constructor(
    private readonly awsService: AwsService,
    @InjectRepository(File) private fileRepository: Repository<File>,
  ) {}

  //게시글 작성
  async create(createPostDto: CreatePostDto, file: Express.Multer.File) {
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
        filePath: filePath,
      });
      return { message: '게시글이 생성되었습니다.', postimage };
    }
    const post = await this.postRepository.save({
      title,
      content,
      category,
      view_count: 0,
    });
    return { message: '게시글이 생성되었습니다.', post };
  }

  //게시글 전체 조회
  async findAll() {
    const post = await this.postRepository.find({ relations: ['file'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    return post;
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
    const post = await this.postRepository.findOne({ where: { id }, relations: ['file'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    post.view_count++;
    await this.postRepository.save(post);

    return post;
  }

  //게시글 수정
  async update(id: number, updatePostDto: UpdatePostDto, file: Express.Multer.File) {
    const post = await this.postRepository.findOne({ where: { id }, relations: ['file'] });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    console.log(post);
    const { title, content, category } = updatePostDto;
    post.title = title;
    post.content = content;
    post.category = category;
    if (file) {
      const imagename = this.awsService.getUUID();
      const ext = file.originalname.split('.').pop();
      const imageUrl = await this.awsService.imageUploadToS3(`${imagename}.${ext}`, file, ext);
      console.log(imageUrl);

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
  async remove(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    await this.postRepository.remove(post);
    return { message: '게시글이 삭제되었습니다' };
  }

  //게시글 좋아요
  async likePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    post.likes++;
    await this.postRepository.save(post);

    return { message: '게시글에 좋아요를 추가했습니다.' };
  }

  //게시글 좋아요 삭제
  async unlikePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.likes > 0) {
      post.likes--;
      await this.postRepository.save(post);
    }

    return { message: '게시글에 대한 좋아요를 취소했습니다.' };
  }
}
