from __future__ import annotations

import argparse
import re
import sqlite3
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EXCEL = ROOT / "외국인학생목록.xlsx"
DEFAULT_DB = ROOT / "data" / "kmust.sqlite"
NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


FIELDS = [
    "sequence",
    "student_no",
    "nationality",
    "admission_type",
    "screening_type",
    "admission_date",
    "admission_grade",
    "grade",
    "recognized_semester",
    "gender",
    "program",
    "college",
    "department",
    "gpa",
    "scholarship_name",
    "academic_status",
    "insurance_company",
    "insurance_start_date",
    "insurance_end_date",
    "language_certificate",
    "language_certificate_level",
    "language_certificate_score",
    "language_certificate_valid_until",
    "language_training_completed",
]


def column_index(ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", ref.upper())
    index = 0
    for letter in letters:
        index = index * 26 + (ord(letter) - ord("A") + 1)
    return index - 1


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for item in root.findall("a:si", NS):
        values.append("".join(text.text or "" for text in item.findall(".//a:t", NS)))
    return values


def read_sheet_rows(excel_path: Path) -> list[list[Any]]:
    with zipfile.ZipFile(excel_path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows: list[list[Any]] = []

        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values: list[Any] = []
            for cell in row.findall("a:c", NS):
                idx = column_index(cell.attrib.get("r", "A"))
                while len(values) <= idx:
                    values.append("")

                value_node = cell.find("a:v", NS)
                inline_node = cell.find("a:is/a:t", NS)
                raw = ""
                if inline_node is not None:
                    raw = inline_node.text or ""
                elif value_node is not None:
                    raw = value_node.text or ""

                if cell.attrib.get("t") == "s" and raw != "":
                    values[idx] = shared_strings[int(raw)]
                else:
                    values[idx] = raw
            rows.append(values)

    return rows


def blank_to_none(value: Any) -> str | None:
    text = str(value).strip()
    return text if text else None


def to_int(value: Any) -> int | None:
    text = blank_to_none(value)
    if text is None:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def to_float(value: Any) -> float | None:
    text = blank_to_none(value)
    if text is None:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def to_bool(value: Any) -> int:
    text = (blank_to_none(value) or "").lower()
    return 1 if text in {"1", "true", "y", "yes", "이수", "완료"} else 0


def to_date(value: Any) -> str | None:
    text = blank_to_none(value)
    if text is None:
        return None

    if re.fullmatch(r"\d+(\.\d+)?", text):
        serial = float(text)
        return (datetime(1899, 12, 30) + timedelta(days=serial)).date().isoformat()

    for fmt in ("%Y.%m.%d", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass
    return text


def normalize_student(row: list[Any]) -> dict[str, Any]:
    padded = row + [""] * (len(FIELDS) - len(row))
    return {
        "sequence": to_int(padded[0]),
        "student_no": blank_to_none(padded[1]) or "",
        "nationality": blank_to_none(padded[2]) or "미상",
        "admission_type": blank_to_none(padded[3]) or "미상",
        "screening_type": blank_to_none(padded[4]) or "미상",
        "admission_date": to_date(padded[5]),
        "admission_grade": to_int(padded[6]),
        "grade": to_int(padded[7]),
        "recognized_semester": to_int(padded[8]),
        "gender": blank_to_none(padded[9]) or "미상",
        "program": blank_to_none(padded[10]) or "미상",
        "college": blank_to_none(padded[11]) or "미상",
        "department": blank_to_none(padded[12]) or "미상",
        "gpa": to_float(padded[13]),
        "scholarship_name": blank_to_none(padded[14]) or "해당없음",
        "academic_status": blank_to_none(padded[15]) or "미상",
        "insurance_company": blank_to_none(padded[16]) or "미상",
        "insurance_start_date": to_date(padded[17]),
        "insurance_end_date": to_date(padded[18]),
        "language_certificate": blank_to_none(padded[19]) or "미상",
        "language_certificate_level": blank_to_none(padded[20]) or "미상",
        "language_certificate_score": to_float(padded[21]),
        "language_certificate_valid_until": to_date(padded[22]),
        "language_training_completed": to_bool(padded[23]),
    }


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        create table if not exists students (
          sequence integer,
          student_no text primary key,
          nationality text not null,
          admission_type text not null,
          screening_type text not null,
          admission_date text,
          admission_grade integer,
          grade integer,
          recognized_semester integer,
          gender text not null,
          program text not null,
          college text not null,
          department text not null,
          gpa real,
          scholarship_name text not null,
          academic_status text not null,
          insurance_company text not null,
          insurance_start_date text,
          insurance_end_date text,
          language_certificate text not null,
          language_certificate_level text not null,
          language_certificate_score real,
          language_certificate_valid_until text,
          language_training_completed integer not null
        );

        create table if not exists import_runs (
          id integer primary key autoincrement,
          source_file text not null,
          imported_at text not null,
          row_count integer not null
        );
        """
    )


def import_students(excel_path: Path, db_path: Path) -> int:
    rows = read_sheet_rows(excel_path)
    students = [normalize_student(row) for row in rows[1:] if len(row) > 1 and blank_to_none(row[1])]

    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    try:
        create_schema(connection)
        connection.execute("delete from students")
        placeholders = ", ".join("?" for _ in FIELDS)
        columns = ", ".join(FIELDS)
        connection.executemany(
            f"insert into students ({columns}) values ({placeholders})",
            [[student[field] for field in FIELDS] for student in students],
        )
        connection.execute(
            "insert into import_runs (source_file, imported_at, row_count) values (?, ?, ?)",
            (str(excel_path), datetime.now().isoformat(timespec="seconds"), len(students)),
        )
        connection.commit()
    finally:
        connection.close()

    return len(students)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import 외국인학생목록.xlsx into SQLite.")
    parser.add_argument("--excel", type=Path, default=DEFAULT_EXCEL)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()

    count = import_students(args.excel, args.db)
    print(f"Imported {count} students into {args.db}")


if __name__ == "__main__":
    main()
