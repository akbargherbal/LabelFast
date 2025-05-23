from flask import Flask, render_template, json # Import json
import os # For a more robust template path
import pandas as pd
import regex as re
import os


app = Flask(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.template_folder = os.path.join(BASE_DIR, 'templates')
app.static_folder = os.path.join(BASE_DIR, 'static')


df = pd.read_pickle('./DATASET_MSA_QATIFI_SENTENCES.pkl')

list_sentence_pairs = df.to_dict(orient='records')

@app.route('/')
def index():
    """Serves the main HTML page and injects sentencePairs data."""
    # Convert the Python list of dicts to a JSON string
    # The 'safe' filter in Jinja2 will ensure it's correctly escaped for JavaScript
    sentence_pairs_json = json.dumps(list_sentence_pairs)
    return render_template('v003.html', sentence_pairs_data=sentence_pairs_json)

if __name__ == '__main__':
    app.run(debug=True)