import { NormalizedLandmark } from '@mediapipe/tasks-vision';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [9, 10], [10, 11], [11, 12],     // Middle
  [13, 14], [14, 15], [15, 16],   // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]       // Palm base
];

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarksInput: NormalizedLandmark[] | NormalizedLandmark[][],
  mirror: boolean = true,
  isPinching: boolean = false,
  primaryColor: string = '#38bdf8'
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!landmarksInput) return;

  // Normalize input into an array of hands
  const handsList: NormalizedLandmark[][] = Array.isArray(landmarksInput[0])
    ? (landmarksInput as NormalizedLandmark[][])
    : [landmarksInput as NormalizedLandmark[]];

  if (handsList.length === 0 || !handsList[0] || handsList[0].length === 0) return;

  const handColors = [
    { bone: primaryColor, pinch: '#ec4899', joint: '#38bdf8' },
    { bone: '#10b981', pinch: '#f59e0b', joint: '#34d399' } // Second hand color palette (Emerald/Amber)
  ];

  handsList.forEach((landmarks, handIdx) => {
    if (!landmarks || landmarks.length === 0) return;

    const colors = handColors[handIdx % handColors.length];

    // Draw bone lines
    ctx.lineWidth = 3;
    ctx.strokeStyle = isPinching && handIdx === 0 ? colors.pinch : colors.bone;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      if (!p1 || !p2) continue;

      const x1 = (mirror ? 1 - p1.x : p1.x) * width;
      const y1 = p1.y * height;
      const x2 = (mirror ? 1 - p2.x : p2.x) * width;
      const y2 = p2.y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw joints
    landmarks.forEach((p, index) => {
      const x = (mirror ? 1 - p.x : p.x) * width;
      const y = p.y * height;

      ctx.beginPath();
      // Index tip (8) and thumb tip (4) get highlight circles
      if (index === 8 || index === 4) {
        ctx.arc(x, y, isPinching && handIdx === 0 ? 8 : 6, 0, 2 * Math.PI);
        ctx.fillStyle = isPinching && handIdx === 0 ? colors.pinch : colors.joint;
      } else if (index === 0) {
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#f59e0b'; // amber wrist
      } else {
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
      }
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    });

    // Draw pinch halo ring if pinching
    if (isPinching && handIdx === 0 && landmarks[8] && landmarks[4]) {
      const p8 = landmarks[8];
      const p4 = landmarks[4];
      const midX = (mirror ? 1 - (p8.x + p4.x) / 2 : (p8.x + p4.x) / 2) * width;
      const midY = ((p8.y + p4.y) / 2) * height;

      ctx.beginPath();
      ctx.arc(midX, midY, 14, 0, 2 * Math.PI);
      ctx.strokeStyle = colors.pinch;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  });
}

