import Vex from "vexflow";

const VF = Vex.Flow;

//Written in JS to avoid getting errors from private methods/traits not exposed by the Vexflow types

export class BreathModifier extends Vex.Flow.Annotation {
  constructor() {
    return super("’");
  }

  draw() {
    this.checkContext();

    if (!this.note) {
      throw new Vex.RERR(
        "NoNoteForAnnotation",
        "Can't draw text annotation without an attached note."
      );
    }

    this.setRendered();
    const start = this.note.getModifierStartXY(
      VF.Modifier.Position.ABOVE,
      this.index
    );

    // We're changing context parameters. Save current state.
    this.context.save();
    this.context.setFont(this.font.family, this.font.size, this.font.weight);
    const text_width = this.context.measureText(this.text).width;

    // Estimate text height to be the same as the width of an 'm'.
    //
    // This is a hack to work around the inability to measure text height
    // in HTML5 Canvas (and SVG).
    const text_height = this.context.measureText("m").width;
    let x;
    let y;

    if (this.justification === VF.Annotation.Justify.LEFT) {
      x = start.x + 10;
    } else if (this.justification === VF.Annotation.Justify.RIGHT) {
      x = start.x - text_width;
    } else if (this.justification === VF.Annotation.Justify.CENTER) {
      x = start.x - text_width / 2;
    } /* CENTER_STEM */ else {
      x = this.note.getStemX() - text_width / 2;
    }

    let stem_ext;
    let spacing;
    const has_stem = this.note.hasStem();
    const stave = this.note.getStave();

    // The position of the text varies based on whether or not the note
    // has a stem.
    if (has_stem) {
      stem_ext = this.note.getStem().getExtents();
      spacing = stave.getSpacingBetweenLines();
    }

    if (this.vert_justification === VF.Annotation.VerticalJustify.BOTTOM) {
      // HACK: We need to compensate for the text's height since its origin
      // is bottom-right.
      y = stave.getYForBottomText(this.text_line + 1);
      if (has_stem) {
        const stem_base =
          this.note.getStemDirection() === 1 ? stem_ext.baseY : stem_ext.topY;
        y = Math.max(y, stem_base + spacing * (this.text_line + 2));
      }
    } else if (
      this.vert_justification === VF.Annotation.VerticalJustify.CENTER
    ) {
      const yt = this.note.getYForTopText(this.text_line) - 1;
      const yb = stave.getYForBottomText(this.text_line);
      y = yt + (yb - yt) / 2 + text_height / 2;
    } else if (this.vert_justification === VF.Annotation.VerticalJustify.TOP) {
      y = Math.min(
        stave.getYForTopText(this.text_line),
        this.note.getYs()[0] - 10
      );
      if (has_stem) {
        y = Math.min(y, stem_ext.topY - 5 - spacing * this.text_line);
      }
    } /* CENTER_STEM */ else {
      const extents = this.note.getStemExtents();
      y = extents.topY + (extents.baseY - extents.topY) / 2 + text_height / 2;
    }

    this.context.fillText(this.text, x, y);
    this.context.restore();
  }
}
