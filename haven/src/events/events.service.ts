import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { IngestEventBody } from "src/hl-common/entities/Events";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class EventsService {
  constructor(private readonly prismaService: PrismaService) {}

  async ingestEvent(userId: number, body: IngestEventBody) {
    const baseEvent = {
      timestamp: new Date(body.timestamp),
      user_id: userId,
      course_id: body.courseId,
    };

    const queries: Prisma.PrismaPromise<any>[] = [];

    const cardSubmitData = {
      ...baseEvent,
      uuid: body.uuid,
      card_id: body.cardId,
      module_id: body.moduleId,
      answer:
        body.answer !== undefined
          ? (body.answer as Prisma.InputJsonValue)
          : Prisma.DbNull,
      correct: body.correct,
      skip: body.skip,
      retryable: body.retryable,
      duration: body.duration,
    };

    queries.push(
      this.prismaService.card_submit_events.upsert({
        where: { uuid: body.uuid },
        update: { timestamp: new Date(body.timestamp) },
        create: cardSubmitData,
      }),
    );

    if (body.extraEvents?.moduleBeginUuid) {
      queries.push(
        this.prismaService.module_begin_events.upsert({
          where: {
            user_id_course_id_module_id: {
              user_id: userId,
              course_id: body.courseId,
              module_id: body.moduleId,
            },
          },
          update: { timestamp: new Date(body.timestamp) },
          create: {
            ...baseEvent,
            uuid: body.extraEvents.moduleBeginUuid,
            module_id: body.moduleId,
          },
        }),
      );
    }

    if (body.extraEvents?.moduleCompleteUuid) {
      queries.push(
        this.prismaService.module_complete_events.upsert({
          where: {
            user_id_course_id_module_id: {
              user_id: userId,
              course_id: body.courseId,
              module_id: body.moduleId,
            },
          },
          update: { timestamp: new Date(body.timestamp) },
          create: {
            ...baseEvent,
            uuid: body.extraEvents.moduleCompleteUuid,
            module_id: body.moduleId,
          },
        }),
      );
    }

    if (body.extraEvents?.courseCompleteUuid) {
      queries.push(
        this.prismaService.course_complete_events.upsert({
          where: { uuid: body.extraEvents.courseCompleteUuid },
          update: { timestamp: new Date(body.timestamp) },
          create: {
            ...baseEvent,
            uuid: body.extraEvents.courseCompleteUuid,
          },
        }),
      );
    }

    return this.prismaService.$transaction(queries);
  }

  async getUserEventsByCourse(userId: number, courseId: number) {
    const [moduleBeginEvents, moduleCompleteEvents] = await Promise.all([
      this.prismaService.module_begin_events.findMany({
        where: { user_id: userId, course_id: courseId },
      }),
      this.prismaService.module_complete_events.findMany({
        where: { user_id: userId, course_id: courseId },
      }),
    ]);

    return { moduleBeginEvents, moduleCompleteEvents };
  }
}
