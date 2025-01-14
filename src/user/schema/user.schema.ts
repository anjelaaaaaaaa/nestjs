import { Document, Types } from 'mongoose';
import { Role } from '@prisma/client';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Movie } from '../../movie/schema/movie.schema';
import { MovieUserLike } from '../../movie/schema/movie-user-like.schema';
import { Chat } from '../../chat/schema/chat.schema';
import { ChatRoom } from '../../chat/schema/chat-room.schema';

/**
 * 아래 스키마는 mongoose에서 import한 Schema
 */
// export const userSchema = new Schema({
//   email: String,
//   password: String,
//   role: Role,
//   createdMovies: [
//     {
//       type: Types.ObjectId,
//       ref: 'Movie',
//     },
//   ],
//   likedMovies: [
//     {
//       type: Types.ObjectId,
//       ref: 'MovieUserLike',
//     },
//   ],
//   chats: [
//     {
//       type: Types.ObjectId,
//       ref: 'Chat',
//     },
//   ],
//   chatRooms: [
//     {
//       type: Types.ObjectId,
//       ref: 'ChatRoom',
//     },
//   ],
// });

@Schema({
  timestamps: true, // createdAt, updatedAt 관리해줌
})
export class User extends Document {
  @Prop({
    unique: true,
    required: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Movie',
      },
    ],
  })
  createdMovies: Movie[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'MovieUserLike',
      },
    ],
  })
  likedMovies: MovieUserLike[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Chat',
      },
    ],
  })
  chats: Chat[];

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'ChatRoom',
      },
    ],
  })
  chatRooms: ChatRoom[];
}
export const UserSchema = SchemaFactory.createForClass(User);
