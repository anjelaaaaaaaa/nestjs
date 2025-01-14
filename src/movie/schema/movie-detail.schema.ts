import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Movie } from './movie.schema';

@Schema({
  timestamps: true,
})
export class MovieDetail extends Document {
  @Prop({
    required: true,
  })
  detail: string;

  @Prop({
    required: true,
    unique: true,
    type: Types.ObjectId,
    ref: 'Movie',
  })
  movie: Movie;
}
export const MovieDetailSchema = SchemaFactory.createForClass(MovieDetail);
