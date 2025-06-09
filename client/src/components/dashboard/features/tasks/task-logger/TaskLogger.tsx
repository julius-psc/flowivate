"use client";

import React from "react";
import { IconLoader2, IconSquareRoundedPlus2 } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import ListHeader from "./ListHeader";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import { useTaskLoggerState } from "./useTaskLoggerState";

const TaskLogger: React.FC = () => {
  const {
    mounted,
    isAddingList,
    setIsAddingList,
    newListName,
    setNewListName,
    activeTaskInputValues,
    setActiveTaskInputValues,
    aiBreakdownState,
    aiPrimedListId,
    setAiPrimedListId,
    listAddingTaskId,
    setListAddingTaskId,
    taskInputRefs,
    expandedTasks,
    openPriorityDropdown,
    addingSubtaskTo,
    setAddingSubtaskTo,
    editingTaskId,
    editingTaskValue,
    setEditingTaskValue,
    subscriptionStatus,
    status,
    taskLists,
    isLoadingLists,
    updateListMutation,
    deleteListMutation,
    getCompletionRatio,
    handleAddList,
    handleDeleteList,
    handleKeyDownTaskInput,
    handleToggleTaskCompletion,
    handleDeleteTask,
    handleSetPriority,
    handleStartEditing,
    handleCancelEditing,
    handleSaveEditing,
    handleEditInputKeyDown,
    toggleTaskExpansion,
    togglePriorityDropdown,
    handleAiBreakdown,
  } = useTaskLoggerState();

  const { theme } = useTheme();

  const headingColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-900 dark:text-gray-100";

  const inputStyle = !mounted
    ? "text-transparent border-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white border-white focus:border-white"
    : "text-slate-700 dark:text-slate-300 border-slate-300/50 dark:border-zinc-600/50 focus:border-secondary-black dark:focus:border-secondary-black";

  const addListStyle = !mounted
    ? "text-transparent border-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "border-white text-white hover:border-white hover:text-white"
    : "border-secondary-black/40 hover:border-secondary-black hover:text-secondary-black";

  const isFreeUser = subscriptionStatus === "free";
  const canAddList = !isFreeUser || taskLists.length < 2;

  const canAddTask = (list: (typeof taskLists)[number]) =>
    !isFreeUser || list.tasks.length < 4;

  const showNoListsMessage =
    status === "authenticated" &&
    !isLoadingLists &&
    taskLists.length === 0 &&
    !isAddingList;

  const showSignInMessage =
    status === "unauthenticated" && taskLists.length === 0;

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 max-w-3xl mx-auto w-full">
        <h1 className={`text-lg font-semibold ${headingColor}`}>My Tasks</h1>
        {updateListMutation.isPending && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse flex items-center gap-1">
            <IconLoader2 size={12} className="animate-spin" /> Saving...
          </span>
        )}
      </div>

      {/* Task Lists */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-2">
          {showNoListsMessage && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-10">
              No task lists yet. Add one below!
            </div>
          )}
          {showSignInMessage && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              Please sign in to manage your tasks.
            </div>
          )}

          {taskLists.map((list) => {
            const isPlaceholder = !!list._id?.startsWith("placeholder-");
            const isAiProcessingList =
              aiBreakdownState.isLoading &&
              aiBreakdownState.listId === list._id;
            const isDisabled =
              isPlaceholder ||
              (updateListMutation.isPending &&
                updateListMutation.variables?.id === list._id) ||
              isAiProcessingList;

            return (
              <div key={list._id || list.name} className="mb-6 group/list">
                {/* List Header */}
                <ListHeader
                  listName={list.name}
                  headingColor={headingColor}
                  completionRatio={getCompletionRatio(list.tasks)}
                  isPlaceholder={isPlaceholder}
                  isDeleting={
                    deleteListMutation.isPending &&
                    deleteListMutation.variables === list._id
                  }
                  onDelete={() => handleDeleteList(list._id)}
                />

                {/* Tasks */}
                {(list.tasks || [])
                  .sort((a, b) => b.priority - a.priority)
                  .map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      listId={list._id!}
                      level={0}
                      expandedTasks={expandedTasks}
                      toggleTaskExpansion={toggleTaskExpansion}
                      editingTaskId={editingTaskId}
                      editingTaskValue={editingTaskValue}
                      editInputRef={taskInputRefs}
                      handleStartEditing={handleStartEditing}
                      setEditingTaskValue={setEditingTaskValue}
                      handleEditInputKeyDown={handleEditInputKeyDown}
                      handleSaveEditing={handleSaveEditing}
                      handleCancelEditing={handleCancelEditing}
                      openPriorityDropdown={openPriorityDropdown}
                      togglePriorityDropdown={togglePriorityDropdown}
                      handleToggleTaskCompletion={handleToggleTaskCompletion}
                      handleDeleteTask={handleDeleteTask}
                      handleSetPriority={handleSetPriority}
                      addingSubtaskTo={addingSubtaskTo}
                      setAddingSubtaskTo={setAddingSubtaskTo}
                      subtaskInputRef={taskInputRefs}
                      activeTaskInputValues={activeTaskInputValues}
                      setActiveTaskInputValues={setActiveTaskInputValues}
                      handleKeyDownTaskInput={handleKeyDownTaskInput}
                      isPlaceholder={isPlaceholder}
                      isDisabled={isDisabled}
                    />
                  ))}

                {/* AddTaskInput */}
                {listAddingTaskId === list._id && (
                  <AddTaskInput
                    listId={list._id!}
                    inputRef={(el) => {
                      if (taskInputRefs.current) {
                        taskInputRefs.current[list._id!] = el;
                      }
                    }}
                    inputValue={activeTaskInputValues[list._id] ?? ""}
                    setInputValue={(value) =>
                      setActiveTaskInputValues((prev) => ({
                        ...prev,
                        [list._id!]: value,
                      }))
                    }
                    isAiPrimed={aiPrimedListId === list._id}
                    setAiPrimedListId={setAiPrimedListId}
                    isAiLoading={isAiProcessingList}
                    handleKeyDown={handleKeyDownTaskInput}
                    handleBlur={(e, listId) => {
                      setTimeout(() => {
                        const aiButton = e.target.previousElementSibling;
                        const targetStillFocused =
                          document.activeElement === e.target ||
                          document.activeElement === aiButton;
                        if (
                          !targetStillFocused &&
                          !e.target.value.trim() &&
                          listAddingTaskId === listId &&
                          !aiBreakdownState.isLoading &&
                          aiPrimedListId !== listId
                        ) {
                          setListAddingTaskId(null);
                          setActiveTaskInputValues((prev) => {
                            const newState = { ...prev };
                            delete newState[listId];
                            return newState;
                          });
                        }
                      }, 150);
                    }}
                    onAiClick={() => handleAiBreakdown(list._id!)}
                    isDisabled={isDisabled}
                  />
                )}

                {/* Add Task button */}
                {listAddingTaskId !== list._id && (
                  <button
                    onClick={() => {
                      if (!updateListMutation.isPending && canAddTask(list)) {
                        setListAddingTaskId(list._id!);
                        setAiPrimedListId(null);
                        setActiveTaskInputValues((prev) => ({
                          ...prev,
                          [list._id!]: "",
                        }));
                      }
                    }}
                    disabled={updateListMutation.isPending || !canAddTask(list)}
                    className={`flex items-center gap-1 ${headingColor} hover:text-secondary-black/80 dark:hover:text-secondary-white/80 text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Add task"
                  >
                    <IconSquareRoundedPlus2 size={14} /> <span>Add task</span>
                  </button>
                )}

                {/* Limit message */}
                {isFreeUser && list.tasks.length >= 4 && (
                  <p className="text-xs text-red-500 mt-1">
                    Free users can only have 4 tasks per list. Upgrade for more.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add List */}
      {status === "authenticated" && (
        <div className="max-w-3xl mx-auto w-full px-2 mt-4 flex-shrink-0 z-200">
          {isAddingList && (
            <div className="mb-6 mt-4">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleAddList}
                onBlur={() => {
                  setTimeout(() => {
                    if (!newListName.trim() && isAddingList) {
                      setIsAddingList(false);
                      setNewListName("");
                    }
                  }, 100);
                }}
                className={`w-full text-lg font-medium bg-transparent border-b-2 focus:outline-none transition-all duration-200 disabled:opacity-50 ${inputStyle}`}
                placeholder="New list name..."
                autoFocus
                disabled={updateListMutation.isPending}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Press Enter to save or Escape to cancel
              </p>
            </div>
          )}

          {!isAddingList && (
            <button
              onClick={() => {
                if (!updateListMutation.isPending) {
                  setIsAddingList(true);
                }
              }}
              className="flex items-center justify-center p-2 w-full rounded-lg text-secondary-black hover:text-secondary-black/40 dark:hover:text-secondary-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updateListMutation.isPending || !canAddList}
              title="Add a new task list"
            >
              {updateListMutation.isPending ? (
                <>
                  <IconLoader2 size={18} className="mr-2 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <div
                  className={`flex items-center justify-center px-4 py-2 border-2 border-dotted rounded-2xl hover:bg-primary/5 transition-colors duration-200 ${addListStyle}`}
                >
                  <IconSquareRoundedPlus2 size={18} className="mr-2" />
                  <span className="font-medium">Add new list</span>
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskLogger;
