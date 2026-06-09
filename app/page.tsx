"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [polls, setPolls] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [aiAnswers, setAiAnswers] =
  useState<Record<number, string>>({});
  const [loadingAI, setLoadingAI] =
  useState<number | null>(null);
  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setQuestions(data);
    }
  };
   const fetchPolls = async () => {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*)
    `)
    .order("id", { ascending: false });

  if (error) {
    console.log(error);
    return;
  }

  if (data) {
  const sortedPolls = data.map((poll) => ({
    ...poll,
    poll_options: poll.poll_options?.sort(
      (a: { id: number }, b: { id: number }) => a.id - b.id
    ),
  }));

  setPolls(sortedPolls);
}
};

  useEffect(() => {
    fetchQuestions();
    fetchPolls();
  }, []);

  

const handleDeleteQuestion = async (
  id: number
) => {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id);

  if (error) {
    alert(error.message);
    return;
  }

  fetchQuestions();
};
const handleDeletePoll = async (
  pollId: number
) => {
  const { error: optionsError } =
    await supabase
      .from("poll_options")
      .delete()
      .eq("poll_id", pollId);

  if (optionsError) {
    alert(optionsError.message);
    return;
  }

  const { error: pollError } =
    await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

  if (pollError) {
    alert(pollError.message);
    return;
  }

  fetchPolls();
};
  const handleAsk = async () => {
    if (!name || !question || !category) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase
      .from("questions")
      .insert([
        {
          title: question,
          author: name,
          category: category,
          votes: 0,
        },
      ]);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    setName("");
    setQuestion("");
    setCategory("");

    fetchQuestions();
  };

  const handleUpvote = async (
    id: number,
    currentVotes: number
  ) => {
    await supabase
      .from("questions")
      .update({
        votes: currentVotes + 1,
      })
      .eq("id", id);

    fetchQuestions();
  };
   const handlePollVote = async (
  optionId: number,
  currentVotes: number
) => {
  console.log("Voting...", optionId);

  const { data, error } = await supabase
    .from("poll_options")
    .update({
      votes: currentVotes + 1,
    })
    .eq("id", optionId)
    .select();

  console.log(data);
  console.log(error);

  if (error) {
    alert(error.message);
    return;
  }

  fetchPolls();
};
  const handleCreatePoll = async () => {
  if (!pollQuestion || !option1 || !option2) {
    alert("Fill all poll fields");
    return;
  }
 

  const { data: pollData, error: pollError } = await supabase
    .from("polls")
    .insert([
      {
        questions: pollQuestion,
      },
    ])
    .select();

  if (pollError) {
    alert(pollError.message);
    return;
  }

  const pollId = pollData[0].id;

  const { error: optionError } = await supabase
    .from("poll_options")
    .insert([
      {
        poll_id: pollId,
        option_text: option1,
        votes: 0,
      },
      {
        poll_id: pollId,
        option_text: option2,
        votes: 0,
      },
    ]);

  if (optionError) {
    alert(optionError.message);
    return;
  }

  alert("Poll created successfully!");
  fetchPolls();
  setPollQuestion("");
  setOption1("");
  setOption2("");
};
const generateAIAnswer = async (
  
  questionId: number,
  questionText: string
) => {
  setLoadingAI(questionId);
  const res = await fetch(
    "/api/ai-answer",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        question: questionText,
      }),
    }
  );

  const data = await res.json();

  setAiAnswers((prev) => ({
    ...prev,
    [questionId]: data.answer,  
  }));
  setLoadingAI(null);
};
  const filteredQuestions = questions.filter((q) =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-slate-100 text-black p-8">
      <div className="max-w-4xl mx-auto">

        {/* Summary */}
        <div className="bg-white border rounded-xl p-6 mb-10">
          <h2 className="text-3xl font-bold mb-4">
            Summary
          </h2>

          <div className="border-2 rounded-lg p-6 space-y-4 text-lg">
            <p>
              📝 Total Questions: {questions.length}
            </p>

            <p>
              👨 Total Authors:{" "}
              {new Set(
                questions.map((q) => q.author)
              ).size}
            </p>

            <p>
              🎓 Total Voters:{" "}
              {questions.reduce(
                (sum, q) => sum + q.votes,
                0
              )}
            </p>
          </div>
        </div>

        {/* Live Q&A */}
        <div className="bg-white border rounded-xl p-6">

          <h1 className="text-4xl font-bold mb-6">
            Live Q&A
          </h1>

          <p className="text-gray-600 mb-6">
            Interactive ✓
          </p>

          {/* Form */}
          <div className="space-y-4">

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full p-4 border rounded-lg"
            />

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                className="flex-1 p-4 border rounded-lg"
              />

              <button
                onClick={handleAsk}
                className="px-6 py-4 bg-black text-white rounded-lg"
              >
                Ask
              </button>
            </div>

            <input
              type="text"
              placeholder="Category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="w-full p-4 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full p-4 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Search by name..."
              className="w-full p-4 border rounded-lg"
            />

            <input
              type="text"
              placeholder="Search by category..."
              className="w-full p-4 border rounded-lg"
            />

          </div>

          {/* Question Cards */}
          <div className="mt-8 space-y-4">

            {filteredQuestions.map((q) => (
              
              <div
                key={q.id}
                className="bg-white border-2 rounded-lg p-5 hover:shadow-md transition"
              >
                <h3 className="text-2xl font-semibold mb-2">
                  {q.title}
                </h3>

                <p className="text-gray-600">
                  Asked by {q.author}
                </p>

                <div className="flex justify-between mt-4">
  <span className="bg-gray-200 px-3 py-1 rounded-full">
    {q.category}
  </span>

  <div className="flex gap-4 items-center">

    <button
      onClick={() =>
        handleUpvote(q.id, q.votes)
      }
      className="font-bold hover:text-blue-600"
    >
      ▲ {q.votes}
    </button>
    {loadingAI === q.id ? (
  <span className="text-blue-600 font-bold">
    Generating...
  </span>
) : aiAnswers[q.id] ? (
  <span className="text-green-600 font-bold">
    ✓ AI Generated
  </span>
) : (
  <button
    onClick={() =>
      generateAIAnswer(
        q.id,
        q.title
      )
    }
    className="text-green-600 font-bold"
  >
    Generate AI Answer
  </button>
)}

    <button
      onClick={() =>
        handleDeleteQuestion(q.id)
      }
      className="text-red-500 font-bold"
    >
      Delete
    </button>

  </div>
</div>
{aiAnswers[q.id] && (
  <div className="mt-4 p-4 bg-green-50 border rounded">
    <h4 className="font-bold">
      AI Answer
    </h4>

    <p>{aiAnswers[q.id]}</p>
  </div>
)}
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="text-center text-gray-500 py-10">
                No questions found.
              </div>
            )}

          </div>

        </div>
       <div className="bg-white border rounded-xl p-6 mt-10">
  <h2 className="text-3xl font-bold mb-6">
    Create Poll
  </h2>

  <div className="space-y-4">

    <input
      type="text"
      placeholder="Poll Question"
      value={pollQuestion}
      onChange={(e) =>
        setPollQuestion(e.target.value)
      }
      className="w-full p-4 border rounded-lg"
    />

    <input
      type="text"
      placeholder="Option 1"
      value={option1}
      onChange={(e) =>
        setOption1(e.target.value)
      }
      className="w-full p-4 border rounded-lg"
    />

    <input
      type="text"
      placeholder="Option 2"
      value={option2}
      onChange={(e) =>
        setOption2(e.target.value)
      }
      className="w-full p-4 border rounded-lg"
    />

    <button
      onClick={handleCreatePoll}
      className="px-6 py-3 bg-black text-white rounded-lg"
    >
      Create Poll
    </button>

  </div>
</div><div className="bg-white border rounded-xl p-6 mt-10">
  <h2 className="text-3xl font-bold mb-6">
    Active Polls
  </h2>

  <div className="space-y-4">
  {polls.map((poll) => {

    const totalVotes = poll.poll_options.reduce(
      (sum: number, option: any) =>
        sum + option.votes,
      0
    );

    return (
      <div
        key={poll.id}
        className="border rounded-lg p-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">
            {poll.questions}
          </h3>

          <button
            onClick={() =>
              handleDeletePoll(poll.id)
            }
            className="text-red-500 font-bold"
          >
            Delete Poll
          </button>
        </div>

        {poll.poll_options?.map((option: any) => {

          const percentage =
            totalVotes === 0
              ? 0
              : Math.round(
                  (option.votes / totalVotes) * 100
                );

          return (
            <div
              key={option.id}
              className="flex justify-between border p-3 rounded mb-2"
            >
              <span>{option.option_text}</span>

              <button
                onClick={() => {
                  handlePollVote(
                    option.id,
                    option.votes
                  );
                }}
                className="font-bold hover:text-blue-600"
              >
                ▲ {option.votes} votes ({percentage}%)
              </button>
            </div>
          );
        })}
      </div>
    );
   })}
  </div>

</div> {/* Active Polls */}

</div> {/* max-w-4xl mx-auto */}

</main>
  );
}