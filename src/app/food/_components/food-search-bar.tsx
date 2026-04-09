import Link from "next/link";

type FoodSearchBarProps = {
  query: string;
};

export function FoodSearchBar({ query }: FoodSearchBarProps) {
  return (
    <form
      action="/food"
      method="get"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      role="search"
    >
      <label className="sr-only" htmlFor="food-search-q">
        Поиск по названию
      </label>
      <input
        id="food-search-q"
        name="q"
        type="search"
        placeholder="Например, яблоко"
        defaultValue={query}
        autoComplete="off"
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none placeholder:text-white/40 focus:border-white/30"
      />
      <div className="flex shrink-0 gap-2">
        <button
          type="submit"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
        >
          Найти
        </button>
        {query ? (
          <Link
            href="/food"
            className="rounded-2xl border border-white/15 px-4 py-3 text-center text-sm text-white/80 hover:bg-white/5"
          >
            Сброс
          </Link>
        ) : null}
      </div>
    </form>
  );
}
