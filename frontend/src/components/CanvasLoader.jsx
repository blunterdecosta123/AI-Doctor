import { Html, useProgress } from "@react-three/drei";

export default function CanvasLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div
        className="rounded-full border px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderColor: "rgba(50,50,50,0.10)",
          color: "#323232",
          boxShadow: "0 14px 30px rgba(50,50,50,0.12)",
        }}
      >
        Loading fox {Math.round(progress)}%
      </div>
    </Html>
  );
}
