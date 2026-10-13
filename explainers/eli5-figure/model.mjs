// The facts the figure shows, in one place. Everything drawn or read out comes from here.
//
// Source: github.com/om-ai-lab/VLX-Seek (commit 51f5150)
//   vlx_seek_worker.py           prompt layout, <objK><objfeat> pairs, <ground>/<objects> parsing, index remap
//   inference.py, generate_proposal.py   WeDetect-Base-Uni: 640x640 letterbox, strides 8/16/32, NMS 0.7, top 100
//   docs/inference.md            "The model supports up to 100 object-region tokens"
//   hybrid_finegrained_region_encoder.py  RoI Align on two towers, mean pool, sine box code
//   huggingface.co/omlab/VLX-Seek-1.5-10B config.json  mm_roi_output_size 14, mm_bbox_order_mode raster, mm_num_object_tokens 100
//   task_templates.py            "Detect all the instances of: {}."
//
// The scene is the repo's demo/demo_image.jpg (500 x 399): five mandarins and two apples.
// The boxes below were placed by eye on that photo and passed as --bbox-list would pass them;
// the picks are the correct answers for each query, used to show the mechanism (not a recorded model run).

export const IMAGE = { w: 500, h: 399, file: "demo/demo_image.jpg" };

// Fruit in the photo: centre, radii and the navel or stem, in image pixels, back to front (image top first).
export const FRUIT = [
  { kind: "orange", c: [227, 68], r: [62, 57], mark: [232, 104] },
  { kind: "apple", c: [349, 142], r: [80, 79], mark: [372, 84] },
  { kind: "orange", c: [77, 164], r: [64, 63], mark: [103, 167] },
  { kind: "orange", c: [204, 170], r: [65, 62], mark: [212, 210] },
  { kind: "orange", c: [268, 253], r: [62, 64], mark: [238, 236] },
  { kind: "orange", c: [403, 280], r: [75, 76], mark: [382, 275] },
  { kind: "apple", c: [113, 295], r: [86, 88], mark: [160, 368] },
];

// Region proposals, in caller order: index K becomes <objK>.
export const PROPOSALS = [
  { box: [165, 11, 289, 125], what: "orange" },
  { box: [13, 101, 141, 227], what: "orange" },
  { box: [139, 108, 269, 232], what: "orange" },
  { box: [269, 63, 429, 221], what: "apple" },
  { box: [27, 207, 199, 383], what: "apple" },
  { box: [206, 189, 330, 317], what: "orange" },
  { box: [328, 204, 478, 356], what: "orange" },
  { box: [139, 11, 289, 232], what: "two oranges (one box)" },
  { box: [342, 66, 400, 108], what: "apple stem (part)" },
];

export const MAX_REGIONS = 100;

export const TEMPLATE = "Detect all the instances of: {}.";

// Queries the figure cycles through. picks are proposal indexes, in the order they are emitted.
export const QUERIES = [
  { text: "orange", zh: "橘子", picks: [0, 1, 2, 5, 6] },
  { text: "apple", zh: "苹果", picks: [3, 4] },
  { text: "pear", zh: "梨（图里没有）", picks: [] },
];

// The answer string in the format the worker parses: <ground>label</ground><objects><objK>...</objects>.
// An absent target is answered with the explicit None the 1.5 release trains for.
export function answerOf(query) {
  if (!query.picks.length) return "None";
  return `<ground>${query.text}</ground><objects>${query.picks.map((k) => `<obj${k}>`).join("")}</objects>`;
}

// Tokens spent on localisation only (the label part is the same either way).
// Region reference: one <objK> special token per object; None is one answer.
export const refTokens = (query) => Math.max(1, query.picks.length);

// Writing the box instead, "[x1, y1, x2, y2]", with digits split one per token as Qwen-family
// tokenizers do: 2 brackets + 3 commas + 3 spaces + one token per digit.
export const digitsOf = (n) => String(Math.round(n)).length;
export const boxTokens = (box) => 8 + box.reduce((sum, v) => sum + digitsOf(v), 0);
export const coordTokens = (query) => (query.picks.length ? query.picks.reduce((sum, k) => sum + boxTokens(PROPOSALS[k].box), 0) : 1);

// What one region costs on the input side: the index token plus one feature slot.
export const PROMPT_TOKENS_PER_REGION = 2;

// HFRE facts the key caps carry: the released config sets mm_roi_output_size = 14.
export const ROI_GRID = 14;
