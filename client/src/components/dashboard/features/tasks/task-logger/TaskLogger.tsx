"use client";

import React, { useState, useEffect } from "react";
import { IconLoader2, IconSquareRoundedPlus2 } from "@tabler/icons-react";
import SubPopup from "@/components/dashboard/recyclable/SubPopup";
import ListHeader from "./ListHeader";
import TaskItem from "./TaskItem";
import AddTaskInput from "./AddTaskInput";
import { useTaskLoggerState } from "./useTaskLoggerState";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/Skeleton";

const TaskLogger: React.FC = () => {
  const {
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

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );


  const headingColor = !isMounted
    ? "text-transparent"
    : isSpecialTheme
      ? "text-white"
      : "text-gray-900 dark:text-gray-100";

  const inputBaseStyle =
    "bg-transparent focus:outline-none transition-all duration-200 disabled:opacity-50";
  const inputBorderStyle = !isMounted
    ? "border-transparent"
    : isSpecialTheme
      ? "border-white/20 focus:border-white/50 placeholder:text-white/40"
      : "border-slate-300/50 dark:border-zinc-600/50 focus:border-secondary-black dark:focus:border-secondary-white placeholder:text-zinc-500";
  const inputTextStyle = !isMounted
    ? "text-transparent"
    : isSpecialTheme
      ? "text-white/90"
      : "text-slate-700 dark:text-slate-300";
  const fullInputStyle = `${inputBaseStyle} ${inputBorderStyle} ${inputTextStyle}`;

  const addListBaseStyle =
    "flex items-center justify-center px-4 py-2 border-2 border-dotted rounded-2xl hover:bg-primary/5 transition-colors duration-200";
  const addListBorderStyle = !isMounted
    ? "border-transparent"
    : isSpecialTheme
      ? "border-white/40 hover:border-white/60"
      : "border-secondary-black/80 hover:border-secondary-black dark:border-slate-400 dark:hover:border-secondary-white";
  const addListTextStyle = !isMounted
    ? "text-transparent"
    : isSpecialTheme
      ? "text-white/60 hover:text-white/80"
      : "text-secondary-black/80 hover:text-secondary-black dark:text-slate-400 dark:hover:text-secondary-white";
  const fullAddListStyle = `${addListBaseStyle} ${addListBorderStyle} ${addListTextStyle}`;

  const listContainerBaseClasses =
    "mb-6 backdrop-blur-md rounded-xl p-4 transition-opacity duration-300";
  const listContainerPreMountClasses =
    "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  const listContainerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100";

  const stickyFooterClasses = `sticky bottom-4 z-10 w-fit mx-auto mt-4 flex-shrink-0 backdrop-blur-md rounded-4xl p-2 transition-opacity duration-300 ${isMounted ? listContainerPostMountClasses.replace('mb-6', '').replace('p-4', '').replace('rounded-xl', '') : listContainerPreMountClasses
    }`;

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
    <div className="p-4 flex flex-col min-h-screen">
      <SubPopup
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <div className="flex justify-start items-center mb-4 flex-shrink-0 max-w-3xl mx-auto w-full h-4">
        {updateListMutation.isPending && (
          <span
            className={`text-xs animate-pulse flex items-center gap-1 ${isSpecialTheme ? "text-blue-300" : "text-blue-500 dark:text-blue-400"
              }`}
          >
            <IconLoader2 size={12} className="animate-spin" /> Saving...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-3xl mx-auto w-full px-2">
          {isLoadingLists && (
            <div className="space-y-6 mb-6">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          )}
          {showNoListsMessage && (
            // Wrap "No lists" message in a styled container
            <div
              className={`${listContainerBaseClasses} ${isMounted ? listContainerPostMountClasses : listContainerPreMountClasses
                } flex items-center justify-center min-h-[100px]`} // Add flex centering and min-height
            >
              <p
                className={`text-center ${isSpecialTheme ? "text-white/50" : "text-slate-400 dark:text-slate-500"
                  }`}
              >
                No task lists yet. Add one below!
              </p>
            </div>
          )}
          {showSignInMessage && (
            // Wrap "Sign in" message similarly
            <div
              className={`${listContainerBaseClasses} ${isMounted ? listContainerPostMountClasses : listContainerPreMountClasses
                } flex items-center justify-center min-h-[100px]`}
            >
              <p
                className={`p-4 text-center ${isSpecialTheme ? "text-white/60" : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                Please sign in to manage your tasks.
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
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
                <motion.div
                  key={list._id || list.name}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ duration: 0.2 }}
                  className={`${listContainerBaseClasses} ${isMounted ? listContainerPostMountClasses : listContainerPreMountClasses
                    }`}
                >
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
                    isSpecialTheme={isSpecialTheme}
                  />

                  <AnimatePresence initial={false}>
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
                          isSpecialTheme={isSpecialTheme}
                          subscriptionStatus={subscriptionStatus}
                        />
                      ))}
                  </AnimatePresence>

                  {listAddingTaskId === list._id && (
                    <AddTaskInput
                      listId={list._id!}
                      inputRef={(el) => {
                        if (taskInputRefs.current) {
                          taskInputRefs.current[list._id!] = el;
                        }
                      }}
                      inputValue={activeTaskInputValues[list._id!] ?? ""}
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
                      isSpecialTheme={isSpecialTheme}
                    />
                  )}

                  {listAddingTaskId !== list._id && (
                    <button
                      onClick={() => {
                        if (!updateListMutation.isPending) {
                          if (!canAddTask(list)) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setListAddingTaskId(list._id!);
                          setAiPrimedListId(null);
                          setActiveTaskInputValues((prev) => ({
                            ...prev,
                            [list._id!]: "",
                          }));
                        }
                      }}
                      disabled={updateListMutation.isPending}
                      className={`flex items-center gap-1 ${isSpecialTheme
                          ? "text-white/70 hover:text-white/90"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        } text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Add task"
                    >
                      <IconSquareRoundedPlus2 size={14} />{" "}
                      <span>Add task</span>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {status === "authenticated" && (
        <div className={stickyFooterClasses}>
          {isAddingList ? (
            <div className="w-full">
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
                className={`w-full text-lg font-medium focus:outline-none transition-all duration-200 disabled:opacity-50 ${fullInputStyle}`}
                placeholder="New list name..."
                autoFocus
                disabled={updateListMutation.isPending}
              />
              <p
                className={`text-xs mt-1 ${isSpecialTheme
                    ? "text-white/50"
                    : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                Press Enter to save or Escape to cancel
              </p>
            </div>
          ) : (
            <button
              onClick={() => {
                if (!canAddList) {
                  setShowUpgradeModal(true);
                  return;
                }
                if (!updateListMutation.isPending) {
                  setIsAddingList(true);
                }
              }}
              className="flex items-center justify-center p-2 w-full rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updateListMutation.isPending}
              title="Add a new task list"
            >
              {updateListMutation.isPending ? (
                <>
                  <IconLoader2 size={18} className="mr-2 animate-spin" />
                  <span
                    className={
                      isSpecialTheme
                        ? "text-white/70"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    Adding...
                  </span>
                </>
              ) : (
                <div className={`${fullAddListStyle} w-full`}>
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