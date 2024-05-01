import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import sharp from 'sharp';

const maxLength = 100;

@Injectable()
export class ResizeImagePipe implements PipeTransform {
  isSingleFil(value): value is Express.Multer.File {
    return value && 'fieldname' in value && 'originalname' in value;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    const filetype = value.mimetype.split(value);
    if (filetype[0] === 'image') {
      value = await this.resizeImage(value);
    }
    return value;
  }

  async resizeImage(value: Express.Multer.File) {
    let width;
    let height;

    await sharp(value.buffer)
      .metadata()
      .then(metadata => {
        width = metadata.width;
        height = metadata.height;
      });

    if (width < maxLength && height < maxLength) {
      return value;
    }

    const resizeOption = width >= height ? { width: maxLength } : { height: maxLength };

    const buffer = await sharp(value.buffer)
      .resize({ ...resizeOption })
      .toBuffer();

    value.buffer = buffer;
    return value;
  }
}
