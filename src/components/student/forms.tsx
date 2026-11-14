"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileForm({ profile }: { profile: any }) {
  const [message, setMessage] = useState("");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/student", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "profile",
        fullName: form.get("fullName"),
        mobile: form.get("mobile"),
        city: form.get("city"),
        course: form.get("course"),
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? "Profile saved." : data.error || "Could not save.");
  }
  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-3 p-6">
      <label className="block"><span className="label">Full name</span><input name="fullName" defaultValue={profile.full_name || ""} className="field" required /></label>
      <label className="block"><span className="label">Email</span><input defaultValue={profile.email || ""} className="field bg-paper" readOnly /></label>
      <label className="block"><span className="label">Mobile</span><input name="mobile" defaultValue={profile.mobile || ""} className="field" /></label>
      <label className="block"><span className="label">City</span><input name="city" defaultValue={profile.city || ""} className="field" /></label>
      <label className="block"><span className="label">Preferred course</span><input name="course" defaultValue={profile.preferred_course || ""} className="field" /></label>
      <button className="btn-orange">Save profile</button>
      {message ? <p className="text-sm font-semibold">{message}</p> : null}
    </form>
  );
}

export function StartTestButton({ testId }: { testId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="btn-orange"
        onClick={async () => {
          setError("");
          const res = await fetch("/api/student", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "start-test", testId }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error || "Could not start the test."); return; }
          router.push(`/student/tests/${testId}?attempt=${data.attemptId}`);
        }}
      >
        Start / resume test
      </button>
      {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export function TestRunner({ testId, attemptId, questions }: { testId: string; attemptId: string; questions: any[] }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const question = questions[current];
  async function save(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    await fetch("/api/student", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "save-answer", attemptId, questionId, optionId }),
    });
  }
  async function submit() {
    const res = await fetch("/api/student", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "submit-test", attemptId }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error || "Could not submit."); return; }
    router.push(`/student/results/${attemptId}`);
  }
  if (!question) return <p>This test has no questions yet.</p>;
  return (
    <div className="card space-y-4 p-6">
      <p className="text-sm font-semibold text-orange">Question {current + 1} of {questions.length}</p>
      <h2 className="text-xl font-extrabold text-navy">{question.prompt}</h2>
      <div className="space-y-2">
        {question.options.map((option: any) => (
          <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 ${answers[question.id] === option.id ? "border-orange bg-cream" : "border-slate-200"}`}>
            <input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => void save(question.id, option.id)} />
            <span>{option.option_text}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-line" disabled={current === 0} onClick={() => setCurrent((n) => Math.max(0, n - 1))}>Previous</button>
        <button type="button" className="btn-navy" disabled={current >= questions.length - 1} onClick={() => setCurrent((n) => Math.min(questions.length - 1, n + 1))}>Next</button>
        <button type="button" className="btn-orange" onClick={() => void submit()}>Submit test</button>
      </div>
      {message ? <p className="font-semibold text-red-700">{message}</p> : null}
      <p className="text-xs text-slate-500">Test {testId}</p>
    </div>
  );
}
