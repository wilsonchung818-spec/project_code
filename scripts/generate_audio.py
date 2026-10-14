"""Generate stable lesson audio assets with a US English neural voice."""

from __future__ import annotations

import argparse
import asyncio
import json
import re
from dataclasses import dataclass
from pathlib import Path

import edge_tts


ROOT = Path(__file__).resolve().parents[1]
LESSONS_PATH = ROOT / "data" / "lessons.json"
OUTPUT_DIR = ROOT / "assets" / "audio"
VOICE = "en-US-AriaNeural"
RATE = "-4%"
PITCH = "-2Hz"
VOLUME = "+0%"


@dataclass(frozen=True)
class AudioJob:
    path: Path
    text: str


def pronunciation_text(text: str) -> str:
    """Expand domain acronyms so the voice reads each letter clearly."""
    replacements = {
        r"\bAPI\b": "A. P. I.",
        r"\bUAT\b": "U. A. T.",
        r"\bSIT\b": "S. I. T.",
        r"\bID\b": "I. D.",
    }
    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text)
    return text


def load_jobs() -> tuple[dict, list[AudioJob]]:
    content = json.loads(LESSONS_PATH.read_text(encoding="utf-8"))
    jobs: list[AudioJob] = []
    for lesson in content["lessons"]:
        day_prefix = f"day-{lesson['day']:02d}"
        for section in lesson["sections"]:
            for sentence in section["sentences"]:
                sentence_prefix = f"{day_prefix}-{sentence['id'].lower()}"
                jobs.append(AudioJob(OUTPUT_DIR / f"{sentence_prefix}.mp3", pronunciation_text(sentence["text"])))
                for index, example in enumerate(sentence["examples"], start=1):
                    jobs.append(AudioJob(OUTPUT_DIR / f"{sentence_prefix}-e{index}.mp3", pronunciation_text(example)))
    return content, jobs


async def generate(job: AudioJob, semaphore: asyncio.Semaphore, force: bool) -> str:
    if not force and job.path.exists() and job.path.stat().st_size > 1_000:
        return "skipped"
    async with semaphore:
        for attempt in range(1, 4):
            try:
                communicator = edge_tts.Communicate(
                    job.text,
                    VOICE,
                    rate=RATE,
                    volume=VOLUME,
                    pitch=PITCH,
                )
                await communicator.save(str(job.path))
                if job.path.stat().st_size <= 1_000:
                    raise RuntimeError("generated file is unexpectedly small")
                return "generated"
            except Exception:
                if attempt == 3:
                    raise
                await asyncio.sleep(attempt * 1.5)
    raise RuntimeError("unreachable")


async def run(force: bool, concurrency: int) -> None:
    content, jobs = load_jobs()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(concurrency)
    counters = {"generated": 0, "skipped": 0}
    lock = asyncio.Lock()

    async def tracked(job: AudioJob) -> None:
        result = await generate(job, semaphore, force)
        async with lock:
            counters[result] += 1
            completed = counters["generated"] + counters["skipped"]
            if completed % 10 == 0 or completed == len(jobs):
                print(f"Audio {completed}/{len(jobs)} ({counters['generated']} generated, {counters['skipped']} skipped)", flush=True)

    await asyncio.gather(*(tracked(job) for job in jobs))
    manifest = {
        "contentVersion": content["contentVersion"],
        "voice": VOICE,
        "voiceDescription": "AI-generated US female news-style voice",
        "rate": RATE,
        "pitch": PITCH,
        "clips": len(jobs),
    }
    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Regenerate existing audio files")
    parser.add_argument("--concurrency", type=int, default=4)
    args = parser.parse_args()
    asyncio.run(run(args.force, max(1, min(args.concurrency, 8))))


if __name__ == "__main__":
    main()
