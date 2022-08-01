import { Document, Types } from 'mongoose';
import {
  IUser,
  IUserCourse,
  PurchaseState,
  UserRole,
} from '@microservices-nestjs/interfaces';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class UserCourses extends Document implements IUserCourse {
  @Prop({ required: true })
  courseId: string;

  @Prop({
    required: true,
    enum: PurchaseState,
    type: String,
  })
  purchaseState: PurchaseState;
}

export const UserCoursesSchema = SchemaFactory.createForClass(UserCourses);

@Schema()
export class User extends Document implements IUser {
  @Prop()
  displayName: string;

  @Prop({ isRequired: true })
  email: string;

  @Prop({ isRequired: true })
  passwordHash: string;

  @Prop({
    isRequired: true,
    enum: UserRole,
    type: String,
    default: UserRole.Student,
  })
  role: UserRole;

  @Prop({ type: [UserCoursesSchema], _id: false })
  courses: Types.Array<UserCourses>;
}

export const UserSchema = SchemaFactory.createForClass(User);
