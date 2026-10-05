import { useState, type DragEvent } from 'react';

/**
 * Native HTML5 drag-and-drop reordering. Pair it with move buttons so the list
 * also works with a keyboard and on touch screens.
 */
export function useDragReorder(onMove: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const itemProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/x-neverupload-index', String(index));
    },
    onDragOver: (e: DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== index) setOverIndex(index);
    },
    onDrop: (e: DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      e.stopPropagation();
      if (dragIndex !== index) onMove(dragIndex, index);
      reset();
    },
    onDragEnd: reset,
  });

  return { itemProps, dragIndex, overIndex };
}
