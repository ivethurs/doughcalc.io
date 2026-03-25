from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


def calculate_sourdough(flour_grams, hydration_pct, starter_pct, loaf_count, loaf_size_g):
    """
    All baker's math is based on total flour weight as 100%.
    
    - hydration_pct: water as % of flour (e.g. 75 means 75g water per 100g flour)
    - starter_pct: starter as % of flour (e.g. 20 means 20g starter per 100g flour)
    - Starter itself is assumed to be 100% hydration (equal flour+water)
    """

    # If scaling by loaf count/size, compute total dough target and back-calculate flour
    if loaf_count and loaf_size_g:
        total_dough_target = loaf_count * loaf_size_g
        # total_dough = flour + water + starter
        # water = flour * hydration_pct/100
        # starter = flour * starter_pct/100
        # total_dough = flour * (1 + hydration_pct/100 + starter_pct/100)
        dough_multiplier = 1 + (hydration_pct / 100) + (starter_pct / 100)
        flour_grams = total_dough_target / dough_multiplier

    flour = round(flour_grams, 1)
    water = round(flour * hydration_pct / 100, 1)
    starter = round(flour * starter_pct / 100, 1)

    # Starter breakdown (assumed 100% hydration starter)
    starter_flour = round(starter / 2, 1)
    starter_water = round(starter / 2, 1)

    total_dough = round(flour + water + starter, 1)
    actual_hydration = round((water + starter_water) / (flour + starter_flour) * 100, 1)

    return {
        "flour": flour,
        "water": water,
        "starter": starter,
        "starter_flour": starter_flour,
        "starter_water": starter_water,
        "total_dough": total_dough,
        "actual_hydration": actual_hydration,
        "loaves": loaf_count or 1,
        "per_loaf": round(total_dough / (loaf_count or 1), 1),
        # Baker's percentages
        "bp_water": hydration_pct,
        "bp_starter": starter_pct,
        "bp_salt": 2.0,
        "salt": round(flour * 0.02, 1),
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    try:
        flour = float(data.get("flour", 500))
        hydration = float(data.get("hydration", 75))
        starter_pct = float(data.get("starter_pct", 20))
        loaf_count = int(data.get("loaf_count", 1))
        loaf_size = float(data.get("loaf_size", 0))

        # Validate ranges
        if not (40 <= hydration <= 120):
            return jsonify({"error": "Hydration should be between 40% and 120%"}), 400
        if not (5 <= starter_pct <= 50):
            return jsonify({"error": "Starter % should be between 5% and 50%"}), 400
        if flour <= 0:
            return jsonify({"error": "Flour must be greater than 0"}), 400

        result = calculate_sourdough(flour, hydration, starter_pct, loaf_count, loaf_size if loaf_size > 0 else None)
        return jsonify(result)

    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400


if __name__ == "__main__":
    app.run(debug=False)