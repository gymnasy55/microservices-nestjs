import { BuyCourseSagaState } from './buy-course.state';
import { UserEntity } from '../entities/user.entity';
import {
  CourseGetCourse,
  PaymentCheck,
  PaymentGenerateLink,
  PaymentStatus,
} from '@microservices-nestjs/contracts';
import { PurchaseState } from '@microservices-nestjs/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
    return { user: this.saga.user };
  }

  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Payment could be checked as its not started');
  }

  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<
      CourseGetCourse.Request,
      CourseGetCourse.Response
    >(CourseGetCourse.topic, {
      id: this.saga.courseId,
    });
    if (!course) {
      throw new Error('Course not found');
    }
    if (course.price === 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return { paymentLink: null, user: this.saga.user };
    }
    const { link } = await this.saga.rmqService.send<
      PaymentGenerateLink.Request,
      PaymentGenerateLink.Response
    >(PaymentGenerateLink.topic, {
      courseId: course._id,
      userId: this.saga.user._id,
      sum: course.price,
    });
    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return {
      paymentLink: link,
      user: this.saga.user,
    };
  }
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Payment is already in progress');
  }

  public async checkPayment(): Promise<{
    user: UserEntity;
    status: PaymentStatus;
  }> {
    const { status } = await this.saga.rmqService.send<
      PaymentCheck.Request,
      PaymentCheck.Response
    >(PaymentCheck.topic, {
      courseId: this.saga.courseId,
      userId: this.saga.user._id,
    });
    if (status === 'cancelled') {
      this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
      return { user: this.saga.user, status };
    }
    if (status !== 'success') {
      return { user: this.saga.user, status };
    }
    this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
    return { user: this.saga.user, status };
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Payment is already in progress');
  }
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Course is already bought');
  }

  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Course is already bought');
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Course is already bought');
  }
}

export class BuyCourseSagaStateCancelled extends BuyCourseSagaState {
  public cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId);
    return this.saga.getState().pay();
  }

  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Course is already cancelled');
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Course is already cancelled');
  }
}
