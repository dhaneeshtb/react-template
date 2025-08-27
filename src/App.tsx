import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import * as Checkbox from "@radix-ui/react-checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Check, Info, Trash2, Plus, Sun, Moon, ArrowLeft } from "lucide-react";

// ---- Types -----------------------------------------------------------------
export type Todo = { id: string; title: string; completed: boolean };

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };
const Button: React.FC<ButtonProps> = ({ className = "", ...props }) => (
  <button
    className={
      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium " +
      "border border-transparent shadow-sm transition " +
      "bg-indigo-600 hover:bg-indigo-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 " +
      className
    }
    {...props}
  />
);

const IconButton: React.FC<ButtonProps> = ({ className = "", ...props }) => (
  <button
    className={
      "grid place-items-center rounded-xl p-2 border border-transparent " +
      "bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 " +
      "transition focus:outline-none focus:ring-2 focus:ring-indigo-400 " +
      className
    }
    {...props}
  />
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };
const Input: React.FC<InputProps> = ({ className = "", ...props }) => (
  <input
    className={
      "w-full rounded-2xl border bg-white/90 dark:bg-slate-900/70 " +
      "border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 " +
      "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 " +
      className
    }
    {...props}
  />
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
  <div
    className={
      "rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 " +
      "shadow-sm " +
      className
    }
    {...props}
  />
);

// ---- Helpers ---------------------------------------------------------------
const STORAGE_KEY = "todos-v2" as const;

function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function useDarkMode(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("prefers-dark");
    return saved ? JSON.parse(saved) : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    localStorage.setItem("prefers-dark", JSON.stringify(dark));
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);
  return [dark, setDark];
}

// ---- Todo List -------------------------------------------------------------
interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ todos, onToggle, onRemove }) => {
  if (!todos.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">No todos yet. Add your first one! 🎯</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {todos.map((t) => (
        <li key={t.id} className="group">
          <Card className="flex items-center gap-3 px-4 py-3">
            <Checkbox.Root
              checked={t.completed}
              onCheckedChange={(_: CheckedState) => onToggle(t.id)}
              className={
                "h-5 w-5 grid place-items-center rounded-md border " +
                "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 " +
                "focus:outline-none focus:ring-2 focus:ring-indigo-400"
              }
              aria-label={`Mark ${t.title} as ${t.completed ? "incomplete" : "complete"}`}
            >
              <Checkbox.Indicator>
                <Check className="h-4 w-4" />
              </Checkbox.Indicator>
            </Checkbox.Root>

            <span
              className={
                "flex-1 text-slate-800 dark:text-slate-100 " +
                (t.completed ? "line-through opacity-60" : "")
              }
            >
              {t.title}
            </span>

            <Dialog.Root>
              <Dialog.Trigger asChild>
                <IconButton aria-label={`Delete ${t.title}`} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                <Dialog.Content
                  className={
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 " +
                    "w-[92vw] max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800"
                  }
                >
                  <Dialog.Title className="text-lg font-semibold">Delete todo?</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    This action cannot be undone.
                  </Dialog.Description>
                  <div className="mt-6 flex justify-end gap-2">
                    <Button
                      className="bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                      onClick={() => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => onRemove(t.id)}>Delete</Button>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </Card>
        </li>
      ))}
    </ul>
  );
};

// ---- Todos Hook ------------------------------------------------------------
function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) return saved as Todo[];
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title: string) => setTodos((curr) => [{ id: uid(), title, completed: false }, ...curr]);
  const removeTodo = (id: string) => setTodos((curr) => curr.filter((t) => t.id !== id));
  const toggleTodo = (id: string) => setTodos((curr) => curr.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  return { todos, addTodo, removeTodo, toggleTodo } as const;
}

// ---- Pages -----------------------------------------------------------------
const Home: React.FC = () => {
  const { todos, addTodo, removeTodo, toggleTodo } = useTodos();
  const [value, setValue] = useState<string>("");
  const [dark, setDark] = useDarkMode();

  const completed = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    addTodo(v);
    setValue("");
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconButton onClick={() => window.history.back()} className="sm:hidden" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
            <Link to="/" className="text-xl font-semibold tracking-tight">Todo App</Link>
            <Link to="/about" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-sm flex items-center gap-1">
              <Info className="h-4 w-4" /> About
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{completed}/{todos.length} done</span>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch.Root
                checked={dark}
                onCheckedChange={setDark}
                className="relative h-6 w-11 rounded-full bg-slate-300 data-[state=checked]:bg-indigo-600 transition"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-[22px] rounded-full bg-white shadow transition-transform" />
              </Switch.Root>
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Card className="p-5">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue((e.target as HTMLInputElement).value)}
              placeholder="Add a new task…"
              aria-label="Add todo"
            />
            <Button type="submit" className="shrink-0">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </Card>

        <TodoList todos={todos} onToggle={toggleTodo} onRemove={removeTodo} />
      </main>
    </div>
  );
};

const About: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="p-8 space-y-4">
          <h1 className="text-2xl font-semibold">About this Todo App</h1>
          <p className="text-slate-600 dark:text-slate-300">
            A minimal, accessible Todo built with <code>Radix UI</code> primitives and styled with Tailwind. Tasks are stored in
            <code> localStorage</code> so they persist across reloads. Use the switch in the header to toggle dark mode.
          </p>
          <Link to="/" className="inline-block">
            <Button>Back to app</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

// ---- App Shell -------------------------------------------------------------
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
};

export default App;
