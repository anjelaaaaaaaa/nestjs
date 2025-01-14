import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Movie } from '../../movie/schema/movie.schema';

@Schema({
  timestamps: true,
})
export class Director extends Document {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
  })
  dob: Date;

  @Prop({
    require: true,
  })
  nationality: string;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: 'Movie',
      },
    ],
  })
  movies: Movie[];
}
export const DirectorSchema = SchemaFactory.createForClass(Director);
