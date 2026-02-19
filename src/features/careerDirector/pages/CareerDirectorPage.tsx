import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Brain, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/shared/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { useCareerStore } from "../../../store/career.store";
import { useCareerDirectorStore } from "../../../store/careerDirector.store";
import { useSeasonsStore } from "../../../store/seasons.store";
import { useTransfersStore } from "../../../store/transfers.store";
import { useToast } from "../../../hooks/useToast";
import { todayISO } from "../../../utils/date";
import { hydrateCareerModules } from "../../../services/api/hydrate";
import type {
  CareerDirectorFocus,
  CareerDirectorReportOutput,
  CareerDirectorTone,
} from "../../../services/api/careerDirector.api";

const TONE_OPTIONS: { value: CareerDirectorTone; label: string }[] = [
  { value: "Supportive", label: "Supportive" },
  { value: "Balanced", label: "Balanced" },
  { value: "Harsh", label: "Harsh" },
];

const FOCUS_OPTIONS: { value: CareerDirectorFocus; label: string }[] = [
  { value: "UCL", label: "UCL" },
  { value: "Domestic", label: "Domestic" },
  { value: "Development", label: "Development" },
  { value: "Transfers", label: "Transfers" },
  { value: "Mentality", label: "Mentality" },
];

const WINDOW_OPTIONS = [
  { value: "WHOLE_CAREER", label: "Whole Career" },
  { value: "5", label: "Last 5 Matches" },
  { value: "8", label: "Last 8 Matches" },
  { value: "12", label: "Last 12 Matches" },
  { value: "16", label: "Last 16 Matches" },
  { value: "20", label: "Last 20 Matches" },
];

const DEFAULT_NOTE_TAG = "Strategy" as const;

export const CareerDirectorPage: React.FC = () => {
  const { careerId } = useParams<{ careerId: string }>();
  const { career, activeCareerId, activateCareer, loadProfileState } =
    useCareerStore();
  const addChallenge = useSeasonsStore((s) => s.addChallenge);
  const addNarrativeTag = useSeasonsStore((s) => s.addNarrativeTag);
  const addAgentNote = useTransfersStore((s) => s.addAgentNote);

  const reportsByCareer = useCareerDirectorStore((s) => s.reportsByCareer);
  const chatsByCareer = useCareerDirectorStore((s) => s.chatsByCareer);
  const loadingByCareer = useCareerDirectorStore((s) => s.loadingByCareer);
  const chatLoadingByCareer = useCareerDirectorStore(
    (s) => s.chatLoadingByCareer,
  );
  const loadHistory = useCareerDirectorStore((s) => s.loadHistory);
  const generateReport = useCareerDirectorStore((s) => s.generateReport);
  const sendChat = useCareerDirectorStore((s) => s.sendChat);

  const toast = useToast((s) => s.show);

  const [tone, setTone] = useState<CareerDirectorTone>("Balanced");
  const [focus, setFocus] = useState<CareerDirectorFocus>("Development");
  const [windowValue, setWindowValue] = useState<string>("8");
  const [chatInput, setChatInput] = useState("");
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);

  const resolvedCareerId = careerId || activeCareerId || null;
  const reports = resolvedCareerId
    ? reportsByCareer[resolvedCareerId] || []
    : [];
  const chats = resolvedCareerId ? chatsByCareer[resolvedCareerId] || [] : [];
  const latestReport = reports.length ? reports[reports.length - 1] : null;
  const loading = resolvedCareerId
    ? !!loadingByCareer[resolvedCareerId]
    : false;
  const chatLoading = resolvedCareerId
    ? !!chatLoadingByCareer[resolvedCareerId]
    : false;

  const windowInput = useMemo(
    () => ({
      wholeCareer: windowValue === "WHOLE_CAREER",
      recentMatches:
        windowValue === "WHOLE_CAREER" ? undefined : Number(windowValue),
    }),
    [windowValue],
  );

  useEffect(() => {
    if (!careerId) return;
    if (activeCareerId === careerId) {
      void loadHistory(careerId).catch((err) => {
        toast(
          err instanceof Error
            ? err.message
            : "Failed to load career director context",
          "error",
        );
      });
      return;
    }
    void (async () => {
      try {
        await activateCareer(careerId);
        await hydrateCareerModules(careerId);
        await loadProfileState(careerId);
        await loadHistory(careerId);
      } catch (err) {
        toast(
          err instanceof Error
            ? err.message
            : "Failed to load career director context",
          "error",
        );
      }
    })();
  }, [
    careerId,
    activeCareerId,
    activateCareer,
    loadProfileState,
    loadHistory,
    toast,
  ]);

  const saveAgentNote = async (content: string) => {
    const clean = content.trim();
    if (!clean) return;
    const key = `note:${clean}`;
    try {
      setActionBusyKey(key);
      await addAgentNote({
        date: todayISO(),
        content: clean,
        tag: DEFAULT_NOTE_TAG,
      });
      toast("Saved as agent note", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save agent note",
        "error",
      );
    } finally {
      setActionBusyKey(null);
    }
  };

  const saveNarrativeTag = async (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const key = `tag:${clean}`;
    try {
      setActionBusyKey(key);
      await addNarrativeTag({ season: career?.season || "", tag: clean });
      toast("Saved as narrative tag", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save narrative tag",
        "error",
      );
    } finally {
      setActionBusyKey(null);
    }
  };

  const saveMilestone = async (
    item: CareerDirectorReportOutput["milestonesSuggested"][number],
  ) => {
    const key = `milestone:${item.label}`;
    try {
      setActionBusyKey(key);
      await addChallenge({
        season: career?.season || "",
        label: item.label,
        target: Math.max(1, Math.round(item.target)),
        current: 0,
        unit: item.unit,
        completed: false,
      });
      toast("Saved as milestone", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save milestone",
        "error",
      );
    } finally {
      setActionBusyKey(null);
    }
  };

  const handleGenerate = async () => {
    if (!resolvedCareerId) {
      toast("No career selected", "error");
      return;
    }
    try {
      await generateReport(resolvedCareerId, {
        tone,
        focus,
        ...windowInput,
      });
      toast("Career Director report generated", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to generate report",
        "error",
      );
    }
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || !resolvedCareerId) return;

    try {
      await sendChat(resolvedCareerId, {
        message,
        tone,
        focus,
        ...windowInput,
      });
      setChatInput("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chat failed", "error");
    }
  };

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div
      style={{
        background: "var(--card-gradient)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <PageHeader
        title="Career Director"
        subtitle={
          career
            ? `${career.playerName} • ${career.club} • ${career.season}`
            : "AI narrative command center"
        }
        icon={<Brain size={18} />}
        actions={
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ width: "140px" }}>
              <Select
                value={tone}
                onChange={(e) => setTone(e.target.value as CareerDirectorTone)}
                options={TONE_OPTIONS}
              />
            </div>
            <div style={{ width: "150px" }}>
              <Select
                value={focus}
                onChange={(e) =>
                  setFocus(e.target.value as CareerDirectorFocus)
                }
                options={FOCUS_OPTIONS}
              />
            </div>
            <div style={{ width: "170px" }}>
              <Select
                value={windowValue}
                onChange={(e) => setWindowValue(e.target.value)}
                options={WINDOW_OPTIONS}
              />
            </div>
            <Button
              type="button"
              variant="green"
              icon={<Sparkles size={14} />}
              onClick={() => {
                void handleGenerate();
              }}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        }
      />

      {latestReport
        ? card(
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gap: "6px" }}>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Headline
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800 }}>
                  {latestReport.output.headline}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Phase:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {latestReport.output.phase}
                  </strong>{" "}
                  ({Math.round(latestReport.output.phaseConfidence * 100)}%) •
                  Reputation:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {latestReport.output.reputationScore.score}/100
                  </strong>{" "}
                  • European Impact:{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {latestReport.output.europeanImpactIndex.score}/100
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: "10px",
                }}
              >
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Pressure Board
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.pressureBoard.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Ruthless Truths
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "#fca5a5",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.ruthlessTruths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
              </div>

              {card(
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Storyline
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: "8px",
                      fontSize: "12px",
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    <div>{latestReport.output.storyline.recentArc}</div>
                    <div>{latestReport.output.storyline.seasonArc}</div>
                    <div>{latestReport.output.storyline.longArc}</div>
                  </div>
                </>,
                { padding: "12px" },
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: "10px",
                }}
              >
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Strengths
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Weaknesses
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
              </div>

              {card(
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Next Match Mandates
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {latestReport.output.nextMatchMandates.map((item) => (
                      <div
                        key={item}
                        style={{
                          border: "1px solid var(--border-muted)",
                          borderRadius: "10px",
                          padding: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{ fontSize: "12px", color: "var(--muted)" }}
                        >
                          {item}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={actionBusyKey === `note:${item}`}
                          onClick={() => {
                            void saveAgentNote(`Match mandate: ${item}`);
                          }}
                        >
                          Save as Agent Note
                        </Button>
                      </div>
                    ))}
                  </div>
                </>,
                { padding: "12px" },
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: "10px",
                }}
              >
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      Development Plan
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {latestReport.output.developmentPlan.map((item, idx) => (
                        <div
                          key={`${item.allocation}-${idx}`}
                          style={{
                            border: "1px solid var(--border-muted)",
                            borderRadius: "10px",
                            padding: "8px",
                            display: "grid",
                            gap: "5px",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: 700 }}>
                            {item.allocation}
                          </div>
                          <div
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            {item.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>,
                  { padding: "12px" },
                )}
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      Transfer Outlook
                    </div>
                    <div style={{ fontSize: "12px", marginBottom: "6px" }}>
                      Recommendation:{" "}
                      <strong>
                        {latestReport.output.transferOutlook.recommendation}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                        marginBottom: "8px",
                      }}
                    >
                      {latestReport.output.transferOutlook.rationale}
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.transferOutlook.thresholds.map(
                        (item) => (
                          <li key={item}>{item}</li>
                        ),
                      )}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: "10px",
                }}
              >
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      Milestones Suggested
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {latestReport.output.milestonesSuggested.map((item) => (
                        <div
                          key={`${item.label}:${item.target}:${item.unit}`}
                          style={{
                            border: "1px solid var(--border-muted)",
                            borderRadius: "10px",
                            padding: "8px",
                            display: "grid",
                            gap: "5px",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: 700 }}>
                            {item.label} • {item.target} {item.unit} •{" "}
                            {item.deadline}
                          </div>
                          <div
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            {item.rationale}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={
                                actionBusyKey === `milestone:${item.label}`
                              }
                              onClick={() => {
                                void saveMilestone(item);
                              }}
                            >
                              Save as Milestone
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={actionBusyKey === `note:${item.label}`}
                              onClick={() => {
                                void saveAgentNote(
                                  `${item.label}: ${item.target} ${item.unit} by ${item.deadline}`,
                                );
                              }}
                            >
                              Save as Agent Note
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>,
                  { padding: "12px" },
                )}
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      Narrative Tags Suggested
                    </div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {latestReport.output.narrativeTagsSuggested.map((tag) => (
                        <div
                          key={tag}
                          style={{
                            border: "1px solid var(--border-muted)",
                            borderRadius: "10px",
                            padding: "8px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            {tag}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={actionBusyKey === `tag:${tag}`}
                            onClick={() => {
                              void saveNarrativeTag(tag);
                            }}
                          >
                            Save as Narrative Tag
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>,
                  { padding: "12px" },
                )}
              </div>

              {card(
                <>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Agent Notes Suggested
                  </div>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {latestReport.output.agentNotesSuggested.map((note) => (
                      <div
                        key={note}
                        style={{
                          border: "1px solid var(--border-muted)",
                          borderRadius: "10px",
                          padding: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{ fontSize: "12px", color: "var(--muted)" }}
                        >
                          {note}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={actionBusyKey === `note:${note}`}
                          onClick={() => {
                            void saveAgentNote(note);
                          }}
                        >
                          Save as Agent Note
                        </Button>
                      </div>
                    ))}
                  </div>
                </>,
                { padding: "12px" },
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
                  gap: "10px",
                }}
              >
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Risks
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
                {card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      What To Track Next
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "var(--muted)",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.whatToTrackNext.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
              </div>

              {latestReport.output.dataQualityFlags.length > 0 &&
                card(
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      Data Quality Flags
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "18px",
                        fontSize: "12px",
                        color: "#fbbf24",
                        display: "grid",
                        gap: "4px",
                      }}
                    >
                      {latestReport.output.dataQualityFlags.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>,
                  { padding: "12px" },
                )}
            </div>,
          )
        : card(
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>
              Generate your first Career Director report to create the
              storyline, pressure board, mandates, and transfer/development
              outlook.
            </div>,
          )}

      {card(
        <div style={{ display: "grid", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <MessageSquare size={15} /> Career Director Chat
          </div>

          <div
            style={{
              border: "1px solid var(--border-muted)",
              borderRadius: "12px",
              padding: "10px",
              display: "grid",
              gap: "8px",
              maxHeight: "360px",
              overflowY: "auto",
            }}
          >
            {chats.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                No chat history yet.
              </div>
            ) : (
              chats.map((msg, idx) => (
                <div
                  key={`${msg.timestamp}-${idx}-${msg.role}`}
                  style={{
                    border: "1px solid var(--border-muted)",
                    borderRadius: "10px",
                    padding: "8px",
                    background:
                      msg.role === "assistant"
                        ? "rgba(16,185,129,0.08)"
                        : "rgba(255,255,255,0.02)",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {msg.role === "assistant" ? "Director" : "You"} • {msg.tone}{" "}
                    • {msg.focus} • {msg.contextWindow}
                  </div>
                  <div style={{ fontSize: "12px" }}>{msg.content}</div>
                  {msg.role === "assistant" &&
                    Array.isArray(msg.followUpQuestions) &&
                    msg.followUpQuestions.length > 0 && (
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Follow-up: {msg.followUpQuestions.join(" | ")}
                      </div>
                    )}
                </div>
              ))
            )}
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Career Director anything about form, pressure, transfers, mentality, or development..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSendChat();
                }
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="accent"
                icon={<ShieldAlert size={13} />}
                onClick={() => {
                  void handleSendChat();
                }}
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>,
      )}
    </div>
  );
};
