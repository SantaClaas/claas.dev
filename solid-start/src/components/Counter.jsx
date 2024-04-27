import { createEffect, createSignal } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);

  /** @type {import("solid-js").Signal<number[]>} */
  const [cos, setCos] = createSignal(/** @type {number[]} */ ([]));
  createEffect(() => {
    setCos((previous) => [...previous, count()]);
  });
  const sum = () => cos().reduce((a, b) => a + b, 0);
  return (
    <button
      class="w-[200px] rounded-full bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
      onClick={() => setCount(count() + 1)}
    >
      Clicks: {count()}
      Sum: {sum()}
    </button>
  );
}
