#!/usr/bin/env python3
"""Simple test to verify Google Generative AI client with provided GEMINI_API_KEY.
Runs a text-only generate_content call which avoids image/vision REST permission issues.
"""
import os
import sys
try:
    import google.generativeai as genai
except Exception as e:
    print('google-generativeai not installed:', e)
    sys.exit(2)

def run():
    key = os.getenv('GEMINI_API_KEY', '')
    if not key:
        print('GEMINI_API_KEY not set in environment')
        return 3
    genai.configure(api_key=key)
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        resp = model.generate_content('Hello Gemini — test ping')
        text = getattr(resp, 'text', None)
        if text is None:
            text = str(resp)
        print('Client returned text:', text)
        return 0
    except Exception as e:
        print('Client call failed:', e)
        return 4

if __name__ == '__main__':
    sys.exit(run())
