#!/usr/bin/env python3
"""Convert ui_orig.yaml to the new modular structure."""

import sys
from pathlib import Path

import yaml


def load_yaml(filepath):
    """Load YAML file."""
    with open(filepath, encoding="utf-8") as f:  # noqa: PTH123
        return yaml.safe_load(f)


def save_yaml(data, filepath):
    """Save data to YAML file."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:  # noqa: PTH123
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            sort_keys=False,
            indent=4,
            allow_unicode=True,
        )


def convert_ui_yaml(input_file, output_dir=None):
    """Convert ui_orig.yaml to modular structure.

    Args:
        input_file: Path to ui_orig.yaml
        output_dir: Output directory (defaults to same directory as input_file)
    """
    input_path = Path(input_file)

    if output_dir is None:  # noqa: SIM108
        output_dir = input_path.parent
    else:
        output_dir = Path(output_dir)

    print(f"Loading {input_path}...")  # noqa: T201
    modules_data = load_yaml(input_path)

    if not modules_data:
        return False

    ui_modules_dir = output_dir / "ui-modules"
    ui_modules_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created directory: {ui_modules_dir}")  # noqa: T201

    module_references = {}
    for module_name, module_content in modules_data.items():
        if module_content is None:
            continue

        module_file = ui_modules_dir / f"{module_name}.yaml"
        save_yaml({module_name: module_content}, module_file)
        print(f"Created: {module_file}")  # noqa: T201

        module_references[module_name] = f"ui-modules/{module_name}.yaml"

    new_ui_config = {
        "config_metadata": {"version": "1.0.0"},
        "modules": module_references,
    }

    output_ui_file = output_dir / "ui.yaml"
    save_yaml(new_ui_config, output_ui_file)
    print(f"Created: {output_ui_file}")  # noqa: T201

    print("\nConversion complete!")  # noqa: T201
    print(f"Total modules: {len(module_references)}")  # noqa: T201
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_ui_yaml.py <input_file> [output_dir]")  # noqa: T201
        print("Example: python convert_ui_yaml.py ui_orig.yaml .")  # noqa: T201
        sys.exit(1)

    input_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    success = convert_ui_yaml(input_file, output_dir)
    sys.exit(0 if success else 1)
