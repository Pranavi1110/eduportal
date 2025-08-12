import React, { useState, useMemo } from "react";

// allTasks: all tasks from API
// assignedTasks: tasks assigned to this student
// renderTaskCard: function to render a task card (for consistency)
const AllTasksSearchFilter = ({ allTasks, assignedTasks, renderTaskCard }) => {
  // Search/filter state
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStartup, setFilterStartup] = useState("");
  const [filterDeadline, setFilterDeadline] = useState("");

  // Only show tasks that are open and not assigned to this student
  const assignedIds = useMemo(
    () => new Set(assignedTasks.map((t) => t._id)),
    [assignedTasks]
  );
  const openTasks = useMemo(
    () =>
      allTasks.filter(
        (task) =>
          task.status === "open" &&
          (!task.assignedStudent || !assignedIds.has(task._id))
      ),
    [allTasks, assignedIds]
  );

  // Get unique categories and startups for filter dropdowns
  const categories = useMemo(
    () => Array.from(new Set(openTasks.map((t) => t.category).filter(Boolean))),
    [openTasks]
  );
  const startupNames = useMemo(
    () =>
      Array.from(
        new Set(
          openTasks.map(
            (t) => t.startup?.companyName || t.startup?.firstName || "Unknown"
          )
        )
      ),
    [openTasks]
  );

  // Filtered open tasks
  const filteredTasks = useMemo(
    () =>
      openTasks.filter((task) => {
        const matchesSearch =
          search.trim() === "" ||
          (task.title &&
            task.title.toLowerCase().includes(search.toLowerCase())) ||
          (task.category &&
            task.category.toLowerCase().includes(search.toLowerCase())) ||
          (task.startup?.companyName || task.startup?.firstName || "Unknown")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesCategory =
          !filterCategory || task.category === filterCategory;
        const matchesStartup =
          !filterStartup ||
          (task.startup?.companyName ||
            task.startup?.firstName ||
            "Unknown") === filterStartup;
        const matchesDeadline =
          !filterDeadline ||
          (task.deadline &&
            new Date(task.deadline).toISOString().slice(0, 10) ===
              filterDeadline);
        return (
          matchesSearch && matchesCategory && matchesStartup && matchesDeadline
        );
      }),
    [openTasks, search, filterCategory, filterStartup, filterDeadline]
  );

  return (
    <>
      <div className="w-full max-w-6xl mb-4 flex flex-wrap gap-3 items-center justify-center bg-gray-50 p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search by title, category, startup..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-48"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterStartup}
          onChange={(e) => setFilterStartup(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="">All Startups</option>
          {startupNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDeadline}
          onChange={(e) => setFilterDeadline(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Deadline"
        />
        <button
          className="text-xs text-blue-600 underline ml-2"
          onClick={() => {
            setSearch("");
            setFilterCategory("");
            setFilterStartup("");
            setFilterDeadline("");
          }}
        >
          Clear Filters
        </button>
      </div>
      {filteredTasks.length === 0 ? (
        <div className="text-gray-500">No tasks found.</div>
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 py-4">
          {filteredTasks.map((task) => renderTaskCard(task, false))}
        </div>
      )}
    </>
  );
};

export default AllTasksSearchFilter;
