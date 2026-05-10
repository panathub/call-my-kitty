import { createFileRoute } from "@tanstack/react-router";
import { CallTheCatGame } from "@/components/game/CallTheCatGame";

export const Route = createFileRoute("/")({
  component: CallTheCatGame,
  head: () => ({
    meta: [
      { title: "Call The Cat — Voice Mini Game" },
      {
        name: "description",
        content: "A playful browser game: meow into your mic and call the cat home.",
      },
    ],
  }),
});
