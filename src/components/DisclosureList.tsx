import { useState, type ReactNode } from "react";

import { uiText, type Language } from "../i18n/ui-text";

export interface DisclosureListProps<T> {
  readonly id: string;
  readonly items: readonly T[];
  readonly language: Language;
  readonly renderItem: (item: T, index: number) => ReactNode;
  readonly initialLimit?: number;
  readonly emptyText?: string;
  readonly className?: string;
}

export const DisclosureList = <T,>({
  id,
  items,
  language,
  renderItem,
  initialLimit = 5,
  emptyText,
  className = "detail-list",
}: DisclosureListProps<T>) => {
  const [expanded, setExpanded] = useState(false);
  const text = uiText[language];
  const visibleItems = items.filter(
    (_item, index) => expanded || index < initialLimit,
  );

  if (items.length === 0) {
    return <p className="detail-empty">{emptyText ?? text.notApplicable}</p>;
  }

  return (
    <div className="detail-disclosure" data-disclosure-id={id}>
      <p className="detail-count">
        {text.showingCount(visibleItems.length, items.length)}
      </p>
      <ul id={`${id}-list`} className={className}>
        {visibleItems.map((item, index) => (
          <li key={`${id}-${index}`}>{renderItem(item, index)}</li>
        ))}
      </ul>
      {items.length > initialLimit ? (
        <button
          type="button"
          className="detail-disclosure-button"
          aria-expanded={expanded}
          aria-controls={`${id}-list`}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? text.collapseList : text.showAll(items.length)}
        </button>
      ) : null}
    </div>
  );
};
