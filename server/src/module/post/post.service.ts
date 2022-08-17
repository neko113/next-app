import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { FindPostQueryDto } from './dto/find-post-query.dto';

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

  async findPostsByQuries(query: FindPostQueryDto) {
    const size = 20;
    if (!query.cursor) {
      const posts = await this.prismaService.post.findMany({
        take: size,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
      const nextCursor = posts[size - 1]?.id;
      return { posts, nextCursor };
    }
    const posts = await this.prismaService.post.findMany({
      take: size,
      skip: 1,
      cursor: {
        id: query.cursor,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    const nextCursor = posts[size - 1]?.id;

    return { posts, nextCursor };
  }

  async searchPosts(keyword: string) {
    return await this.prismaService.post.findMany({
      where: {
        OR: [
          {
            title: {
              contains: keyword,
            },
          },
          {
            body: {
              contains: keyword,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  async findPostById(id: string) {
    const post = await this.prismaService.post.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    if (!post) throw new NotFoundException();
    return post;
  }

  async createPost(userId: string, dto: CreatePostDto) {
    return await this.prismaService.post.create({
      data: { ...dto, userId },
    });
  }

  async likePost(userId: string, postId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException();

    const alreadyLiked = await this.prismaService.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (!alreadyLiked) {
      await this.prismaService.postLike.create({ data: { postId, userId } });
      const postLikes = await this.prismaService.postLike.count({
        where: { postId },
      });
      await this.prismaService.post.update({
        data: { likes: postLikes },
        where: { id: postId },
      });
    }
    return post;
  }

  async unlikePost(userId: string, postId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException();

    const alreadyLiked = await this.prismaService.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    if (alreadyLiked) {
      await this.prismaService.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
      const postLikes = await this.prismaService.postLike.count({
        where: { postId },
      });
      await this.prismaService.post.update({
        data: { likes: postLikes },
        where: { id: postId },
      });
    }
    return post;
  }

  async deletePost(userId: string, id: string) {
    const post = await this.prismaService.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException();
    if (post.userId !== userId) throw new UnauthorizedException();
    return await this.prismaService.post.delete({
      where: {
        id,
      },
    });
  }
}
