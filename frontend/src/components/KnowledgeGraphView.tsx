import React, { useState, useMemo, useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  BookOpen,
  Atom,
  CheckCircle2,
  Compass,
  Sparkles,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ArrowRight,
  Info,
  Layers,
  FileText,
} from "lucide-react";
import type { GraphData, Paper, Connection } from "../services/api";

interface KnowledgeGraphViewProps {
  graphData: GraphData;
  papers?: Paper[];
  connections?: Connection[];
}

type CategoryFilter = "all" | "paper" | "concept" | "finding";
type ViewMode = "curated" | "full";

// ==========================================
// 1. CUSTOM SCIENTIFIC NODES
// ==========================================
const CustomScientificNode: React.FC<{ data: any; selected?: boolean }> = ({ data, selected }) => {
  const isDimmed = data.isDimmed;
  const isHighlighted = data.isHighlighted;
  const isMultiHopBridge = data.isMultiHopBridge;

  const getNodeTheme = () => {
    switch (data.nodeType) {
      case "paper":
        return {
          badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: <BookOpen className="w-3 h-3 text-indigo-600 inline mr-1 flex-shrink-0" />,
          border: selected
            ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
            : isHighlighted
            ? "border-indigo-500 shadow-sm"
            : "border-indigo-200 hover:border-indigo-400",
          typeLabel: "Research Paper",
          accentColor: "#6366f1",
        };
      case "concept":
        return {
          badgeBg: isMultiHopBridge
            ? "bg-purple-50 text-purple-700 border-purple-200"
            : "bg-blue-50 text-blue-700 border-blue-200",
          icon: isMultiHopBridge ? (
            <Sparkles className="w-3 h-3 text-purple-600 inline mr-1 flex-shrink-0" />
          ) : (
            <Atom className="w-3 h-3 text-blue-600 inline mr-1 flex-shrink-0" />
          ),
          border: selected
            ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md"
            : isHighlighted
            ? "border-blue-500 shadow-sm"
            : isMultiHopBridge
            ? "border-purple-300 hover:border-purple-500"
            : "border-blue-200 hover:border-blue-400",
          typeLabel: isMultiHopBridge ? "Bridge Concept" : "Concept",
          accentColor: isMultiHopBridge ? "#8b5cf6" : "#3b82f6",
        };
      case "finding":
        return {
          badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1 flex-shrink-0" />,
          border: selected
            ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
            : isHighlighted
            ? "border-emerald-500 shadow-sm"
            : "border-emerald-200 hover:border-emerald-400",
          typeLabel: "Finding",
          accentColor: "#10b981",
        };
      case "research_area":
        return {
          badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Compass className="w-3 h-3 text-amber-600 inline mr-1 flex-shrink-0" />,
          border: selected
            ? "border-amber-600 ring-2 ring-amber-500/20 shadow-md"
            : isHighlighted
            ? "border-amber-500 shadow-sm"
            : "border-amber-300 hover:border-amber-500",
          typeLabel: "Research Domain",
          accentColor: "#f59e0b",
        };
      default:
        return {
          badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: null,
          border: selected
            ? "border-slate-600 ring-2 ring-slate-500/20 shadow-md"
            : "border-slate-200 hover:border-slate-400",
          typeLabel: data.category || "Entity",
          accentColor: "#64748b",
        };
    }
  };

  const theme = getNodeTheme();

  return (
    <div
      className={`custom-scientific-node relative px-3 py-2 rounded-lg border bg-white shadow-xs transition-all duration-150 text-left cursor-pointer ${
        theme.border
      } ${
        isDimmed ? "opacity-30 scale-[0.98]" : "opacity-100"
      } ${
        data.nodeType === "finding"
          ? "w-[220px]"
          : data.nodeType === "paper"
          ? "w-[190px]"
          : "w-[170px]"
      }`}
      style={{
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Left Input Handles (for incoming relationships) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-slate-300 hover:!bg-blue-600 !border-2 !border-white transition-colors -ml-1"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-slate-200 hover:!bg-blue-500 !border-2 !border-white opacity-40 hover:opacity-100 transition-colors -mt-1"
      />

      {/* Right Output Handles (for outgoing relationships) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-blue-500 hover:!bg-blue-700 !border-2 !border-white transition-colors -mr-1"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-slate-200 hover:!bg-blue-500 !border-2 !border-white opacity-40 hover:opacity-100 transition-colors -mb-1"
      />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-flex items-center ${theme.badgeBg}`}
        >
          {theme.icon}
          {theme.typeLabel}
        </span>
        {isMultiHopBridge && (
          <span
            className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-1 rounded border border-purple-200"
            title="Bridges multiple papers/pathways"
          >
            Bridge
          </span>
        )}
      </div>

      {/* Node Label */}
      <p
        className={`text-xs font-semibold text-slate-900 leading-snug ${
          data.nodeType === "finding" ? "line-clamp-2" : "line-clamp-1"
        }`}
        title={data.label}
      >
        {data.label}
      </p>

      {/* Optional sub-meta for papers */}
      {data.nodeType === "paper" && data.details?.citation && (
        <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
          {data.details.citation}
        </p>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomScientificNode,
};

// ==========================================
// 2. INNER GRAPH COMPONENT (with Flow Hook)
// ==========================================
const KnowledgeGraphInner: React.FC<KnowledgeGraphViewProps> = ({
  graphData,
  papers = [],
  connections = [],
}) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [viewMode, setViewMode] = useState<ViewMode>("curated");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Map of multi-hop bridging concepts across papers
  const bridgeConceptNames = useMemo(() => {
    const set = new Set<string>();
    connections.forEach((c) => {
      if (c.source_concept) set.add(c.source_concept.toLowerCase());
      if (c.target_concept) set.add(c.target_concept.toLowerCase());
      (c.intermediate_concepts || []).forEach((inter) => set.add(inter.toLowerCase()));
    });
    return set;
  }, [connections]);

  // Compute node degree and multi-hop indicators
  const nodeStats = useMemo(() => {
    const degreeMap = new Map<string, number>();
    const connectedNodeIdsMap = new Map<string, Set<string>>();

    (graphData.edges || []).forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
      degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);

      if (!connectedNodeIdsMap.has(e.source)) connectedNodeIdsMap.set(e.source, new Set());
      if (!connectedNodeIdsMap.has(e.target)) connectedNodeIdsMap.set(e.target, new Set());
      connectedNodeIdsMap.get(e.source)!.add(e.target);
      connectedNodeIdsMap.get(e.target)!.add(e.source);
    });

    return { degreeMap, connectedNodeIdsMap };
  }, [graphData.edges]);

  // Filter raw nodes by ViewMode (Curated vs Full)
  const candidateNodes = useMemo(() => {
    const rawNodes = graphData.nodes || [];
    if (viewMode === "full") {
      return rawNodes;
    }

    // CURATED VIEW: Show highest-relevance nodes to eliminate clutter
    const areaNodes = rawNodes.filter((n) => n.data?.nodeType === "research_area");
    const paperNodes = rawNodes.filter((n) => n.data?.nodeType === "paper");
    const conceptNodes = rawNodes.filter((n) => n.data?.nodeType === "concept");
    const findingNodes = rawNodes.filter((n) => n.data?.nodeType === "finding");

    // Sort concepts by connectivity & bridge status
    const sortedConcepts = [...conceptNodes].sort((a, b) => {
      const aIsBridge = bridgeConceptNames.has(a.data?.label?.toLowerCase() || "") ? 10 : 0;
      const bIsBridge = bridgeConceptNames.has(b.data?.label?.toLowerCase() || "") ? 10 : 0;
      const degA = (nodeStats.degreeMap.get(a.id) || 0) + aIsBridge;
      const degB = (nodeStats.degreeMap.get(b.id) || 0) + bIsBridge;
      return degB - degA;
    });

    // Pick top 8 concepts in curated mode
    const selectedConcepts = sortedConcepts.slice(0, 8);
    const selectedConceptIds = new Set(selectedConcepts.map((c) => c.id));

    // Pick findings that directly connect to these selected concepts
    const selectedFindings = findingNodes
      .filter((f) => {
        const neighbors = nodeStats.connectedNodeIdsMap.get(f.id);
        if (!neighbors) return false;
        for (const cId of selectedConceptIds) {
          if (neighbors.has(cId)) return true;
        }
        return false;
      })
      .slice(0, 5);

    return [...areaNodes, ...paperNodes, ...selectedConcepts, ...selectedFindings];
  }, [graphData.nodes, viewMode, bridgeConceptNames, nodeStats]);

  // Set of candidate IDs for fast lookup
  const candidateNodeIds = useMemo(() => {
    return new Set(candidateNodes.map((n) => n.id));
  }, [candidateNodes]);

  // Filter edges to only those connecting candidate nodes
  const candidateEdges = useMemo(() => {
    return (graphData.edges || []).filter(
      (e) => candidateNodeIds.has(e.source) && candidateNodeIds.has(e.target)
    );
  }, [graphData.edges, candidateNodeIds]);

  // ==========================================
  // 3. SCIENTIFIC TOPOLOGICAL LAYOUT ENGINE
  // Hierarchy: Paper -> Concept -> Finding -> Concept
  // Aligning related nodes vertically to minimize crossing edges
  // ==========================================
  const layoutedNodes: Node[] = useMemo(() => {
    const areas = candidateNodes.filter((n) => n.data?.nodeType === "research_area");
    const papers = candidateNodes.filter((n) => n.data?.nodeType === "paper");
    const concepts = candidateNodes.filter(
      (n) => n.data?.nodeType === "concept" || (!n.data?.nodeType && n.data?.category === "Concept")
    );
    const findings = candidateNodes.filter(
      (n) => n.data?.nodeType === "finding" || n.data?.category === "Finding"
    );
    const others = candidateNodes.filter(
      (n) =>
        !areas.includes(n) && !papers.includes(n) && !concepts.includes(n) && !findings.includes(n)
    );

    // Track active selection
    const activeConnectedNodeIds = selectedNodeId
      ? nodeStats.connectedNodeIdsMap.get(selectedNodeId) || new Set<string>()
      : null;

    const result: Node[] = [];

    // Col 1: Papers & Domain (x = 50)
    let yPaper = 50;
    areas.forEach((n) => {
      result.push({
        id: n.id,
        type: "custom",
        position: { x: 50, y: yPaper },
        data: {
          ...n.data,
          isMultiHopBridge: false,
          isHighlighted: selectedNodeId === n.id,
          isDimmed: selectedNodeId ? selectedNodeId !== n.id && !activeConnectedNodeIds?.has(n.id) : false,
        },
      });
      yPaper += 100;
    });

    papers.forEach((n) => {
      result.push({
        id: n.id,
        type: "custom",
        position: { x: 50, y: yPaper },
        data: {
          ...n.data,
          isMultiHopBridge: false,
          isHighlighted: selectedNodeId === n.id,
          isDimmed: selectedNodeId ? selectedNodeId !== n.id && !activeConnectedNodeIds?.has(n.id) : false,
        },
      });
      yPaper += 120;
    });

    // Col 2 (x = 340) & Col 3 (x = 610): Concepts
    // Order concepts so that concepts connected to earlier papers appear earlier
    const sortedConcepts = [...concepts].sort((a, b) => {
      const aDeg = nodeStats.degreeMap.get(a.id) || 0;
      const bDeg = nodeStats.degreeMap.get(b.id) || 0;
      return bDeg - aDeg;
    });

    sortedConcepts.forEach((n, idx) => {
      const colIndex = idx % 2; // Stagger across 2 concept sub-columns
      const rowIndex = Math.floor(idx / 2);
      const x = colIndex === 0 ? 330 : 590;
      const y = 50 + rowIndex * 88;

      const isBridge = bridgeConceptNames.has(n.data?.label?.toLowerCase() || "");

      result.push({
        id: n.id,
        type: "custom",
        position: { x, y },
        data: {
          ...n.data,
          isMultiHopBridge: isBridge,
          isHighlighted: selectedNodeId === n.id,
          isDimmed: selectedNodeId ? selectedNodeId !== n.id && !activeConnectedNodeIds?.has(n.id) : false,
        },
      });
    });

    // Col 4: Findings (x = 870)
    findings.forEach((n, idx) => {
      result.push({
        id: n.id,
        type: "custom",
        position: { x: 860, y: 50 + idx * 115 },
        data: {
          ...n.data,
          isMultiHopBridge: false,
          isHighlighted: selectedNodeId === n.id,
          isDimmed: selectedNodeId ? selectedNodeId !== n.id && !activeConnectedNodeIds?.has(n.id) : false,
        },
      });
    });

    // Others (if any)
    others.forEach((n, idx) => {
      result.push({
        id: n.id,
        type: "custom",
        position: { x: 590, y: 350 + idx * 85 },
        data: {
          ...n.data,
          isMultiHopBridge: false,
          isHighlighted: selectedNodeId === n.id,
          isDimmed: selectedNodeId ? selectedNodeId !== n.id && !activeConnectedNodeIds?.has(n.id) : false,
        },
      });
    });

    return result;
  }, [candidateNodes, selectedNodeId, nodeStats, bridgeConceptNames]);

  // Format Edges with clean directional smoothstep routing & arrowheads
  const formattedEdges: Edge[] = useMemo(() => {
    return candidateEdges.map((e) => {
      const isSelected = selectedEdgeId === e.id;
      const isConnectedToActiveNode =
        selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);

      const isDimmed =
        (selectedNodeId && !isConnectedToActiveNode) ||
        (selectedEdgeId && !isSelected);

      let stroke = "#94a3b8"; // clean subtle slate
      let strokeWidth = 1.5;
      let zIndex = 1;

      if (isSelected) {
        stroke = "#2563eb";
        strokeWidth = 2.5;
        zIndex = 20;
      } else if (isConnectedToActiveNode) {
        stroke = "#3b82f6";
        strokeWidth = 2;
        zIndex = 10;
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        label: e.label || "RELATES_TO",
        animated: isSelected || !!isConnectedToActiveNode,
        style: {
          stroke,
          strokeWidth,
          opacity: isDimmed ? 0.2 : 1,
        },
        labelStyle: {
          fill: isSelected ? "#1d4ed8" : "#475569",
          fontWeight: 700,
          fontSize: 8.5,
          letterSpacing: "0.03em",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.96,
          stroke: isSelected ? "#3b82f6" : "#e2e8f0",
          strokeWidth: 1,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: stroke,
        },
        data: e.data,
        zIndex,
      };
    });
  }, [candidateEdges, selectedEdgeId, selectedNodeId]);

  // Manage nodes and edges in state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedEdges);

  useMemo(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  useMemo(() => {
    setEdges(formattedEdges);
  }, [formattedEdges, setEdges]);

  // Search & Category Filtering on the display
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      // Category filter
      if (categoryFilter !== "all" && n.data.nodeType !== categoryFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const label = String(n.data.label || "").toLowerCase();
        const cat = String(n.data.category || "").toLowerCase();
        return label.includes(query) || cat.includes(query);
      }
      return true;
    });
  }, [nodes, categoryFilter, searchQuery]);

  // Selected entities for the Details Panel
  const activeNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = graphData.nodes?.find((n) => n.id === selectedNodeId);
    return found?.data || null;
  }, [selectedNodeId, graphData.nodes]);

  const activeEdgeData = useMemo(() => {
    if (!selectedEdgeId) return null;
    return graphData.edges?.find((e) => e.id === selectedEdgeId) || null;
  }, [selectedEdgeId, graphData.edges]);

  // Derived details for selected node:
  // Related concepts, Supporting papers, Empirical findings
  const nodeContext = useMemo(() => {
    if (!selectedNodeId) return null;

    const connectedEdges = (graphData.edges || []).filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );

    const relatedNodeIds = new Set<string>();
    connectedEdges.forEach((e) => {
      relatedNodeIds.add(e.source === selectedNodeId ? e.target : e.source);
    });

    const relatedNodes = (graphData.nodes || []).filter((n) => relatedNodeIds.has(n.id));

    const relatedConcepts = relatedNodes.filter(
      (n) => n.data?.nodeType === "concept" || n.data?.category === "Concept"
    );

    const relatedFindings = relatedNodes.filter(
      (n) => n.data?.nodeType === "finding" || n.data?.category === "Finding"
    );

    // Supporting papers (from connected edges data or connected paper nodes)
    const paperNames = new Set<string>();
    connectedEdges.forEach((e) => {
      if (e.data?.source_paper) paperNames.add(e.data.source_paper);
    });
    relatedNodes
      .filter((n) => n.data?.nodeType === "paper")
      .forEach((p) => paperNames.add(p.data?.label || p.id));

    const resolvedPapers = Array.from(paperNames).map((pName) => {
      const matched = (papers || []).find(
        (p) =>
          p.filename?.toLowerCase() === pName.toLowerCase() ||
          p.title?.toLowerCase().includes(pName.toLowerCase()) ||
          pName.toLowerCase().includes(p.filename?.toLowerCase() || "")
      );
      return {
        name: pName,
        title: matched?.title || pName,
        abstract: matched?.abstract || null,
      };
    });

    return {
      connectedEdges,
      relatedConcepts,
      relatedFindings,
      supportingPapers: resolvedPapers,
    };
  }, [selectedNodeId, graphData.nodes, graphData.edges, papers]);

  // Edge context
  const edgeContext = useMemo(() => {
    if (!activeEdgeData) return null;
    const sourceNode = graphData.nodes?.find((n) => n.id === activeEdgeData.source);
    const targetNode = graphData.nodes?.find((n) => n.id === activeEdgeData.target);
    return {
      sourceLabel: sourceNode?.data?.label || activeEdgeData.source,
      sourceType: sourceNode?.data?.nodeType || "Concept",
      targetLabel: targetNode?.data?.label || activeEdgeData.target,
      targetType: targetNode?.data?.nodeType || "Concept",
      relation: activeEdgeData.label || "RELATES_TO",
      paper: activeEdgeData.data?.source_paper || "Literature Corpus",
      explanation:
        activeEdgeData.data?.explanation ||
        `Identified interaction between ${sourceNode?.data?.label || "source"} and ${
          targetNode?.data?.label || "target"
        } across extracted research findings.`,
    };
  }, [activeEdgeData, graphData.nodes]);

  // Handlers
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    setSelectedEdgeId(null);
  }, []);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id));
    setSelectedNodeId(null);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  return (
    <div className="space-y-3">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-xs">
        {/* Left: View Mode Toggle & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Curated vs Full View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("curated")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "curated"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Shows top connected concepts and clean pathways"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Key Pathways (Curated)
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "full"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Display all extracted nodes and relationships"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Full Graph ({graphData.nodes?.length || 0})
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "paper", label: "Papers" },
                { id: "concept", label: "Concepts" },
                { id: "finding", label: "Findings" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search & Counts */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-6 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] w-40 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Counts */}
          <div className="text-slate-400 font-mono text-[11px] hidden md:block">
            <span>{visibleNodes.length}</span> nodes &bull; <span>{candidateEdges.length}</span> edges
          </div>
        </div>
      </div>

      {/* Visual Scientific Legend & Pathway Guide */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-50/80 rounded-lg border border-slate-200 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700">Hierarchy:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <strong className="text-slate-800">Research Paper</strong>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <strong className="text-slate-800">Concept</strong>
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <strong className="text-slate-800">Empirical Finding</strong>
          </span>
          <span className="h-3 w-px bg-slate-200 mx-1" />
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-purple-700 font-medium">Multi-Hop Bridge</span>
          </span>
        </div>

        <span className="text-[10px] text-slate-400 hidden lg:inline">
          Click any node or relationship to inspect supporting literature
        </span>
      </div>

      {/* Main Canvas & Details Panel Container */}
      <div className="relative w-full h-[640px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {graphData.nodes?.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <Info className="w-8 h-8 mb-2 text-slate-300" />
            <p className="text-sm font-medium">No graph data generated yet.</p>
            <p className="text-xs mt-1 text-slate-500">Run research analysis to construct the knowledge graph.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handleCanvasClick}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            className="bg-white"
            minZoom={0.2}
            maxZoom={1.6}
          >
            {/* Subtle scientific grid background */}
            <Background color="#cbd5e1" gap={24} size={1} />

            {/* Custom Clean Floating Zoom / Pan Controls */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center bg-white border border-slate-200 shadow-sm rounded-lg p-1 gap-1 text-slate-600">
              <button
                onClick={() => zoomIn({ duration: 200 })}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => zoomOut({ duration: 200 })}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-200" />
              <button
                onClick={() => fitView({ duration: 300, padding: 0.25 })}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                  fitView({ duration: 300, padding: 0.25 });
                }}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
                title="Reset Selection & Center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* MiniMap in bottom right */}
            <MiniMap
              className="!bottom-4 !right-4 bg-white/90 border border-slate-200 shadow-xs rounded-lg hidden sm:block"
              nodeColor={(n) => {
                const type = (n.data as any)?.nodeType;
                if (type === "paper") return "#6366f1";
                if (type === "concept") return "#3b82f6";
                if (type === "finding") return "#10b981";
                if (type === "research_area") return "#f59e0b";
                return "#94a3b8";
              }}
              maskColor="rgba(248, 250, 252, 0.7)"
              style={{ width: 140, height: 90 }}
            />
          </ReactFlow>
        )}

        {/* ==========================================
            4. RIGHT-SIDE DETAILS PANEL (for Node)
            ========================================== */}
        {activeNodeData && nodeContext && (
          <div className="absolute top-3 right-3 bottom-3 w-88 max-w-[360px] bg-white/98 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-30 flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2 bg-slate-50/50">
              <div className="space-y-1">
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block ${
                    activeNodeData.nodeType === "paper"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : activeNodeData.nodeType === "concept"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : activeNodeData.nodeType === "finding"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {activeNodeData.category || activeNodeData.nodeType}
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {activeNodeData.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Context Description */}
              {activeNodeData.details?.description ? (
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Scientific Context
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {activeNodeData.details.description}
                  </p>
                </div>
              ) : activeNodeData.details?.abstract ? (
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                    Abstract Excerpt
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                    {activeNodeData.details.abstract}
                  </p>
                </div>
              ) : null}

              {/* Related Concepts */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Related Concepts</span>
                  <span className="font-mono text-slate-500">{nodeContext.relatedConcepts.length}</span>
                </h4>
                {nodeContext.relatedConcepts.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No direct concept neighbors.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {nodeContext.relatedConcepts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedNodeId(c.id)}
                        className="text-[11px] px-2 py-1 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 border border-blue-200 rounded-md font-medium transition-colors inline-flex items-center gap-1 text-left"
                      >
                        <Atom className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{c.data.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Supporting Research Papers */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Supporting Research Papers</span>
                  <span className="font-mono text-slate-500">{nodeContext.supportingPapers.length}</span>
                </h4>
                {nodeContext.supportingPapers.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No explicit paper citations.</p>
                ) : (
                  <div className="space-y-1.5">
                    {nodeContext.supportingPapers.map((paper, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 flex items-start gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 text-[11px] leading-tight">
                            {paper.title || paper.name}
                          </p>
                          {paper.abstract && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                              {paper.abstract}
                            </p>
                          )}
                          <span className="text-[9px] text-indigo-600 font-mono block">
                            {paper.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empirical Findings / Evidence */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Empirical Evidence & Findings</span>
                  <span className="font-mono text-slate-500">{nodeContext.relatedFindings.length}</span>
                </h4>
                {nodeContext.relatedFindings.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No attached findings for this entity.</p>
                ) : (
                  <div className="space-y-2">
                    {nodeContext.relatedFindings.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/70 text-slate-800 space-y-1"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[10px] uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reported Result</span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed">
                          {f.data.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <span>Direct connections:</span>
              <strong className="text-slate-800 font-mono">
                {nodeContext.connectedEdges.length} relationships
              </strong>
            </div>
          </div>
        )}

        {/* ==========================================
            5. RIGHT-SIDE DETAILS PANEL (for Edge)
            ========================================== */}
        {edgeContext && (
          <div className="absolute top-3 right-3 bottom-3 w-88 max-w-[360px] bg-white/98 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl z-30 flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2 bg-slate-50/50">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block font-mono">
                  {edgeContext.relation}
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  Causal / Semantic Interaction
                </h3>
              </div>
              <button
                onClick={() => setSelectedEdgeId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Directed Pathway */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Interaction Pathway
                </h4>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Source:</span>
                    <span className="text-[10px] text-blue-600 uppercase font-semibold">
                      {edgeContext.sourceType}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">{edgeContext.sourceLabel}</p>

                  <div className="flex items-center justify-center py-1 text-blue-600 font-bold text-xs gap-1">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                      {edgeContext.relation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Target:</span>
                    <span className="text-[10px] text-blue-600 uppercase font-semibold">
                      {edgeContext.targetType}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">{edgeContext.targetLabel}</p>
                </div>
              </div>

              {/* Supporting Literature */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Supporting Literature
                </h4>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200/80 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-[11px]">{edgeContext.paper}</p>
                    <p className="text-[10px] text-indigo-600">Cross-paper semantic linkage</p>
                  </div>
                </div>
              </div>

              {/* Mechanistic Explanation */}
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                  Mechanistic Evidence
                </h4>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                  {edgeContext.explanation}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status:</span>
              <span className="font-medium text-emerald-600">Verified Literature Link</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. MAIN EXPORT (Wrapped in ReactFlowProvider)
// ==========================================
export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphInner {...props} />
    </ReactFlowProvider>
  );
};
