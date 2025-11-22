import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="input-group">
      {label && <label htmlFor={props.id}>{label}</label>}
      <input className={`input ${error ? 'input-error' : ''} ${className}`} {...props} />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="input-group">
      {label && <label htmlFor={props.id}>{label}</label>}
      <textarea className={`textarea ${error ? 'input-error' : ''} ${className}`} {...props} />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

