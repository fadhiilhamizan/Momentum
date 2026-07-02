import { useState } from 'react';
import cn from 'classnames';
import { GripVertical } from 'lucide-react';
import TaskCard from './TaskCard';
import { useTaskStore } from '../store/taskStore';

function move(arr, from, to) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * A drag-reorderable task list. Dragging is initiated only from the grip
 * handle (so card buttons and click-to-open still work), using native HTML5
 * drag-and-drop — no extra dependencies. The new order is persisted via
 * taskStore.reorderTasks, which stamps each task's sortOrder.
 */
export default function SortableTaskList({ tasks }) {
  const reorderTasks = useTaskStore((s) => s.reorderTasks);
  const [enabledIndex, setEnabledIndex] = useState(null); // row armed for drag
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const reset = () => {
    setEnabledIndex(null);
    setDragIndex(null);
    setOverIndex(null);
  };

  const commit = () => {
    if (dragIndex != null && overIndex != null && dragIndex !== overIndex) {
      const newOrder = move(tasks, dragIndex, overIndex).map((t) => t.id);
      reorderTasks(newOrder);
    }
    reset();
  };

  return (
    <div className="task-list">
      {tasks.map((task, i) => {
        const isOver = overIndex === i && dragIndex != null && dragIndex !== i;
        return (
          <div
            key={task.id}
            className={cn('sortable-row', {
              dragging: dragIndex === i,
              'drop-above': isOver && i < dragIndex,
              'drop-below': isOver && i > dragIndex,
            })}
            draggable={enabledIndex === i}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              setDragIndex(i);
            }}
            onDragEnter={() => dragIndex != null && setOverIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={commit}
          >
            <button
              className="drag-handle"
              title="Drag to reorder"
              aria-label="Drag to reorder"
              onMouseDown={() => setEnabledIndex(i)}
              onMouseUp={() => setEnabledIndex(null)}
            >
              <GripVertical size={16} />
            </button>
            <div className="sortable-content">
              <TaskCard task={task} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
