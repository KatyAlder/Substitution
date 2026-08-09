import { shortWeekdayName } from "../ranking/presence";
import type { TimeBlock } from "../types/teacher";

const WEEKDAYS = [1, 2, 3, 4, 5];

interface Props {
  blocks: TimeBlock[];
  onChange: (blocks: TimeBlock[]) => void;
}

export function isTimeBlockValid(block: TimeBlock): boolean {
  return !!block.from && !!block.to && block.from < block.to;
}

export function TimeBlockListEditor({ blocks, onChange }: Props) {
  function updateBlock(index: number, patch: Partial<TimeBlock>) {
    onChange(blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function addBlock() {
    onChange([...blocks, { weekday: 1, from: "08:00", to: "09:00" }]);
  }

  return (
    <div className="time-block-editor">
      {blocks.length === 0 && <p className="screen__empty">Немає блоків.</p>}
      {blocks.map((block, i) => (
        <div
          className={`time-block-editor__row${isTimeBlockValid(block) ? "" : " time-block-editor__row--invalid"}`}
          key={i}
        >
          <select value={block.weekday} onChange={(e) => updateBlock(i, { weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((w) => (
              <option key={w} value={w}>
                {shortWeekdayName(w)}
              </option>
            ))}
          </select>
          <input type="time" value={block.from} onChange={(e) => updateBlock(i, { from: e.target.value })} />
          <span>–</span>
          <input type="time" value={block.to} onChange={(e) => updateBlock(i, { to: e.target.value })} />
          <button
            type="button"
            className="time-block-editor__remove"
            onClick={() => removeBlock(i)}
            aria-label="Видалити блок"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn" onClick={addBlock}>
        + Додати
      </button>
    </div>
  );
}
