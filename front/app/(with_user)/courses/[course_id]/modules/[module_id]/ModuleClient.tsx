"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import type { CardEntity } from "@/hl-common/entities/Cards";
import { card_interaction_type } from "@/hl-common/PrismaEnums";

import { ButtonLink } from "@/components/ButtonLink";
import { H2 } from "@/components/Headings";
import CardInteractionNext from "@/components/interactions/CardInteractionNext";
import CardInteractionRadio from "@/components/interactions/CardInteractionRadio";
import Panel from "@/components/Panel";
import { ingestEvent } from "@/utils/api/client";

type Props = {
  module: { id: number; title: string; course_id: number; cards: CardEntity[] };
  courseId: number;
  userId: number;
};

export default function ModuleClient({ module, courseId, userId }: Props) {
  const { cards, id: moduleId } = module;

  useEffect(() => {
    localStorage.setItem("current-user", String(userId));
  }, [userId]);

  const [currentCardIndex, setCurrentCardIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem(`progress-module-${moduleId}`);
    return stored ? Number.parseInt(stored, 10) : 0;
  });

  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasBegun, setHasBegun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCard = cards[currentCardIndex];
  const isFirst = currentCardIndex === 0;

  const recordAttempt = async (answer?: { selectedIndex: number }) => {
    if (!currentCard) return;
    setSubmitting(true);
    setError(null);

    const isLastCard = currentCardIndex === cards.length - 1;
    const shouldSendBegin = !hasBegun;

    try {
      await ingestEvent({
        body: {
          uuid: uuidv4(),
          cardId: currentCard.id,
          moduleId,
          courseId,
          answer: answer ? answer.selectedIndex : null,
          correct: answer
            ? (currentCard.options?.[answer.selectedIndex]?.correct ?? false)
            : false,
          skip: false,
          retryable: false,
          duration: 0,
          timestamp: new Date().toISOString(),
          extraEvents: {
            ...(shouldSendBegin ? { moduleBeginUuid: uuidv4() } : {}),
            ...(isLastCard ? { moduleCompleteUuid: uuidv4() } : {}),
          },
        },
      });

      if (shouldSendBegin) {
        setHasBegun(true);
      }

      setSubmitting(false);
      return true;
    } catch (err) {
      setError("Failed to save your progress. Please try again.");
      setSubmitting(false);
      return false;
    }
  };

  const advanceCard = () => {
    if (!currentCard) return;
    const next = currentCardIndex + 1;
    const isLastCard = currentCardIndex === cards.length - 1;

    if (isLastCard) {
      // Clear localStorage when module is completed
      localStorage.removeItem(`progress-module-${moduleId}`);
      setDone(true);
    } else {
      // Save progress to localStorage
      localStorage.setItem(`progress-module-${moduleId}`, String(next));
      setCurrentCardIndex(next);
    }
  };

  const advance = async (answer?: { selectedIndex: number }) => {
    const success = await recordAttempt(answer);
    if (success) {
      advanceCard();
    }
  };

  if (done) {
    return (
      <div>
        <H2 className="mb-4">{module.title}</H2>
        <Panel>
          <p className="text-green-700 font-semibold text-lg">
            Module complete!
          </p>
          <p className="text-gray-600 mt-2">
            You have finished all {cards.length} cards in this module.
          </p>
          <ButtonLink
            href={`/courses/${courseId}`}
            inline
            medium
            className="mt-4"
          >
            Back to course
          </ButtonLink>
        </Panel>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div>
        <H2 className="mb-4">{module.title}</H2>
        <Panel>
          <p className="text-gray-500">No cards in this module.</p>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <H2 className="mb-1">{module.title}</H2>
      <p className="text-sm text-gray-500 mb-6">
        Card {currentCardIndex + 1} of {cards.length}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Panel title={currentCard.title}>
        <p className="text-gray-700 mb-6">{currentCard.body}</p>

        {currentCard.interaction_type === card_interaction_type.radio &&
        currentCard.options ? (
          <CardInteractionRadio
            options={currentCard.options}
            onAnswer={(selectedIndex) => recordAttempt({ selectedIndex })}
            onNext={advanceCard}
            disabled={submitting}
          />
        ) : (
          <CardInteractionNext onNext={() => advance()} disabled={submitting} />
        )}
      </Panel>
    </div>
  );
}
