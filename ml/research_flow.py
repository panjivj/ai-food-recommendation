"""Generate the research-flow diagram used in the report."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


OUTPUT_PATH = Path(__file__).resolve().parent / "outputs" / "research_flow.png"


def add_box(ax, x, y, width, height, title, detail, color):
    box = FancyBboxPatch(
        (x, y),
        width,
        height,
        boxstyle="round,pad=0.018,rounding_size=0.025",
        linewidth=1.4,
        edgecolor="#263238",
        facecolor=color,
    )
    ax.add_patch(box)
    ax.text(
        x + width / 2,
        y + height * 0.67,
        title,
        ha="center",
        va="center",
        fontsize=10.2,
        fontweight="bold",
        color="#172027",
    )
    ax.text(
        x + width / 2,
        y + height * 0.33,
        detail,
        ha="center",
        va="center",
        fontsize=8.2,
        color="#263238",
        linespacing=1.25,
    )


def add_arrow(ax, start, end, color="#455A64", dashed=False):
    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=14,
            linewidth=1.5,
            color=color,
            linestyle="--" if dashed else "-",
        )
    )


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(9, 12), dpi=180)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    main_x, side_x = 0.08, 0.68
    main_w, side_w, box_h = 0.54, 0.25, 0.075
    ys = [0.85, 0.745, 0.64, 0.535, 0.43, 0.325, 0.22, 0.115]

    boxes = [
        ("Sumber data", "SQLite menu approved + nutrisi\nberbasis TKPI 2017", "#E3F2FD"),
        ("Ekspor dan audit", "614 menu • 7 fitur numerik\nvalidasi skema, nilai, dan hash", "#E8F5E9"),
        ("Preprocessing dan split", "cleaning • stratified 80:20\n491 latih / 123 uji", "#FFF8E1"),
        ("EDA data latih", "histogram • korelasi • boxplot\ndistribusi kelas", "#F3E5F5"),
        ("Baseline", "DT • RF • SVM\n5-fold stratified CV", "#E0F7FA"),
        ("Pemilihan dan tuning", "pilih DT via F1-macro\nGrid Search 216 kombinasi", "#FFF3E0"),
        ("Model final dibekukan", "pipeline terbaik disimpan\ntanpa akses ke test set", "#E8EAF6"),
        ("Evaluasi dan XAI", "test set satu kali • metrik lengkap\nfeature importance model beku", "#E8F5E9"),
    ]

    for y, (title, detail, color) in zip(ys, boxes):
        add_box(ax, main_x, y, main_w, box_h, title, detail, color)

    for upper, lower in zip(ys, ys[1:]):
        add_arrow(
            ax,
            (main_x + main_w / 2, upper),
            (main_x + main_w / 2, lower + box_h),
        )

    add_box(
        ax,
        side_x,
        0.625,
        side_w,
        0.095,
        "Held-out test set",
        "123 menu diisolasi\nsetelah split",
        "#FFEBEE",
    )
    add_arrow(
        ax,
        (main_x + main_w, ys[2] + box_h / 2),
        (side_x, 0.625 + 0.095 / 2),
        color="#C62828",
        dashed=True,
    )
    add_arrow(
        ax,
        (side_x + side_w / 2, 0.625),
        (main_x + main_w, ys[-1] + box_h / 2),
        color="#C62828",
        dashed=True,
    )
    ax.text(
        0.805,
        0.43,
        "Tidak digunakan untuk EDA,\nseleksi model, atau tuning",
        ha="center",
        va="center",
        fontsize=8.2,
        color="#B71C1C",
        bbox={"boxstyle": "round,pad=0.35", "fc": "#FFF5F5", "ec": "#EF9A9A"},
    )

    ax.text(
        0.5,
        0.985,
        "Pipeline Aktual Penelitian",
        ha="center",
        va="top",
        fontsize=15,
        fontweight="bold",
        color="#172027",
    )
    ax.text(
        0.5,
        0.957,
        "Klasifikasi waktu makan berdasarkan ukuran porsi dan informasi gizi",
        ha="center",
        va="top",
        fontsize=9.5,
        color="#455A64",
    )

    fig.savefig(OUTPUT_PATH, bbox_inches="tight", facecolor="white")
    plt.close(fig)


if __name__ == "__main__":
    main()
