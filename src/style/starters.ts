// Optional example master-style prompts. These are NOT built-in styles the app
// enforces; they are editable starting points the user can load and rewrite. The
// real style is whatever master prompt the user supplies.

export interface StyleStarter {
  id: string;
  label: string;
  prompt: string;
}

export const STARTERS: StyleStarter[] = [
  {
    id: "dark-oil",
    label: "Dark Oil Painting",
    prompt:
      "A moody dark-fantasy oil painting, traditional oil on canvas with rich impasto brushwork and aged varnish texture. Palette of bruised indigo, oxblood red, candlelit gold, charcoal black, and bone white. Dramatic chiaroscuro lighting, one warm key light against deep shadow. Ornate dark card frame with tarnished gold filigree. Central subject with a strong foreground focal point and atmospheric depth. Avoid neon colors, flat vector looks, and photographic realism. Every card in the set must look like it hangs in the same gothic gallery.",
  },
  {
    id: "watercolor",
    label: "Watercolor Storybook",
    prompt:
      "A gentle hand-painted watercolor storybook illustration, wet-on-wet washes on cold-press paper with visible grain and loose ink linework. Palette of dusty rose, sage green, sky blue, warm cream, and soft plum. Soft diffuse daylight and gentle gradients. A light hand-inked frame with small painted flourishes. Airy negative space and friendly storybook staging. Avoid harsh contrast, grim gore, and hard 3D renders. Every card should read like a page from the same children's fairytale book.",
  },
  {
    id: "neon-cyber",
    label: "Neon Cyber-Fantasy",
    prompt:
      "A high-energy neon cyber-fantasy digital matte painting where magic is reimagined as luminous technology. Rain-slick reflective surfaces, holographic glow, and volumetric neon fog. Palette of electric cyan, hot magenta, deep violet, acid green, and black chrome. Neon rim light and glowing reflections. A sleek dark frame with glowing circuit-line accents. Dynamic diagonal energy and a luminous focal point. Avoid muted earthy tones and medieval parchment. The whole set should feel like one synthwave-drenched night city.",
  },
  {
    id: "woodcut",
    label: "Woodcut Ink",
    prompt:
      "A stark black-ink woodcut / linocut print with bold carved lines, high-contrast hatching, and an antique broadsheet feel. Palette of ink black and aged paper cream with a single spot of vermilion. Graphic high contrast where form is built from hatching rather than shading. A carved double-rule frame with corner motifs. Flattened graphic space, bold silhouettes, and strong negative shapes. Avoid soft gradients, photoreal texture, and airbrush glow. Every card should look pulled from the same printmaker's block series.",
  },
  {
    id: "art-nouveau",
    label: "Art Nouveau Poster",
    prompt:
      "An elegant Art Nouveau poster in the spirit of Mucha: sinuous organic linework, decorative flat color, gold ornament, and halo motifs behind figures. Palette of muted teal, rose gold, cream, sage, and deep burgundy. Even decorative lighting with subtle modeling. An ornamental frame with floral arches and gold inlay. A centered figure framed by a decorative arch and halo with symmetrical ornament. Avoid gritty realism, harsh neon, and chaotic clutter. Every card should belong to the same cohesive poster series.",
  },
];

export const DEFAULT_STYLE_PROMPT = STARTERS[0].prompt;
