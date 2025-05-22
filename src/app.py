from flask import Flask, jsonify, render_template

app = Flask(__name__)

# The sentence data that was previously hardcoded in JS
SENTENCE_DATA = [
    {
        "source": "لماذا فعلت هذا الشيء يا رجل",
        "target": "ليش عملت هذا الشيء يا رجال",
    },
    {"source": "أين كنت عندما حدث ذلك؟", "target": "وينك يوم صار هالشي؟"},
    {"source": "هذا الطعام لذيذ جدا.", "target": "هالأكل وايد حلو."},
    {
        "source": "هل يمكنك مساعدتي من فضلك؟",
        "target": "تقدر تساعدني لو سمحت؟",
    },
    {"source": "سأراك لاحقاً.", "target": "أشوفك بعدين."},
    {"source": "ما هو اسمك؟", "target": "شنو اسمك؟"},
    {"source": "أنا بخير، شكراً لك.", "target": "أنا زين، مشكور."},
]

@app.route('/')
def index():
    # This could be a landing page or redirect,
    # for now, let's just make it clear what to access
    return """
    <h1>LabelFast PoC Server</h1>
    <p>Access the tools:</p>
    <ul>
        <li><a href="/vanilla">Vanilla JS Version (v004.html)</a></li>
        <li><a href="/alpine">Alpine.js Version (v004_alpinejs.html)</a></li>
    </ul>
    <p>API Endpoint for sentences: <a href="/api/sentences">/api/sentences</a></p>
    """

@app.route('/vanilla')
def vanilla_version():
    # Assuming v004.html is in a 'templates' folder relative to app.py
    return render_template('v004.html')

@app.route('/alpine')
def alpine_version():
    # Assuming v004_alpinejs.html is in a 'templates' folder
    return render_template('v004_alpinejs.html')

@app.route('/api/sentences')
def get_sentences():
    return jsonify(SENTENCE_DATA)

if __name__ == '__main__':
    app.run(debug=True)