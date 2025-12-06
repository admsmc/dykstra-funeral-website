'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Editor } from 'grapesjs';
import type { MemorialTemplate } from '@dykstra/domain';

/**
 * Template Data Structure
 * 
 * Data extracted from GrapesJS editor for saving to database
 */
export interface TemplateData {
  htmlStructure: string;
  cssStyles: string;
  componentTree: unknown;
  dataBindings: Record<string, { selector: string }>;
}

/**
 * Template Editor Props
 */
interface TemplateEditorProps {
  initialTemplate?: MemorialTemplate;
  onSave: (templateData: TemplateData) => void;
  onPreview?: (html: string, css: string) => void;
  autoPreview?: boolean; // Enable real-time preview with debouncing
  autoPreviewDelay?: number; // Debounce delay in ms (default: 2000)
}

/**
 * Memorial Template Editor Component
 * 
 * Visual drag-and-drop editor for creating memorial document templates.
 * Built on GrapesJS with custom funeral-specific blocks.
 * 
 * Features:
 * - Drag-and-drop interface
 * - Custom memorial element blocks (decedent name, photo, obituary, etc.)
 * - Data binding system for dynamic content
 * - Live preview
 * - Template save/load functionality
 * - Device presets (Letter, Prayer Card sizes)
 * 
 * Architecture:
 * - Uses GrapesJS as rendering engine
 * - Extracts HTML/CSS and data bindings on save
 * - Integrates with MemorialTemplate domain entity
 * - Sends template data to use cases via onSave callback
 */
export const MemorialTemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate,
  onSave,
  onPreview,
  autoPreview = false,
  autoPreviewDelay = 2000,
}) => {
  const editorRef = useRef<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    let editor: Editor;

    const initEditor = async () => {
      const grapesjs = (await import('grapesjs')).default;
      const gjsBlocksBasic = (await import('grapesjs-blocks-basic')).default;

      editor = grapesjs.init({
        container: '#gjs-editor',
        height: '800px',
        width: '100%',
        components: initialTemplate?.content.htmlTemplate || '',
        style: initialTemplate?.content.cssStyles || '',
        storageManager: {
          type: 'none', // We handle storage via tRPC
          autosave: false,
        },
        plugins: [gjsBlocksBasic],
        canvas: {
          styles: [
            'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap',
          ],
        },
        deviceManager: {
          devices: [
            {
              name: 'Letter (8.5x11)',
              width: '8.5in',
              height: '11in',
            },
            {
              name: 'Prayer Card (4x6)',
              width: '4in',
              height: '6in',
            },
            {
              name: 'A4',
              width: '210mm',
              height: '297mm',
            },
          ],
        },
        blockManager: {
          appendTo: '#blocks-container',
        },
        layerManager: {
          appendTo: '#layers-container',
        },
        styleManager: {
          appendTo: '#styles-container',
        },
        traitManager: {
          appendTo: '#traits-container',
        },
      });

      // Add custom funeral element blocks
      const blockManager = editor.BlockManager;

      blockManager.add('decedent-name', {
        label: 'Decedent Name',
        content: `
          <h1 
            class="decedent-name" 
            data-bind="deceasedName"
            style="font-family: 'Playfair Display', serif; font-size: 36px; text-align: center; margin: 20px 0;"
          >
            John Doe
          </h1>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-user' },
      });

      blockManager.add('dates', {
        label: 'Birth/Death Dates',
        content: `
          <div 
            class="dates-container" 
            style="text-align: center; font-size: 18px; margin: 10px 0;"
          >
            <span data-bind="birthDate">January 1, 1950</span>
            <span style="margin: 0 10px;">—</span>
            <span data-bind="deathDate">December 1, 2024</span>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-calendar' },
      });

      blockManager.add('cover-photo', {
        label: 'Cover Photo',
        content: `
          <img 
            class="cover-photo" 
            data-bind="photoUrl"
            src="https://via.placeholder.com/800x400/f5f3ed/1e3a5f?text=Cover+Photo" 
            alt="Cover Photo"
            style="width: 100%; max-width: 600px; display: block; margin: 20px auto;"
          />
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-image' },
      });

      blockManager.add('obituary', {
        label: 'Obituary Text',
        content: `
          <div 
            class="obituary" 
            data-bind="obituary"
            style="font-family: 'Inter', sans-serif; line-height: 1.6; margin: 20px 0; padding: 20px;"
          >
            <p>John Doe, 74, of Grand Rapids, Michigan, passed away peacefully on December 1, 2024, surrounded by his loving family. Born on January 1, 1950, John lived a life filled with kindness, humor, and dedication to his community.</p>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-align-left' },
      });

      blockManager.add('order-of-service', {
        label: 'Order of Service',
        content: `
          <div 
            class="order-of-service" 
            data-bind-array="orderOfService"
            style="margin: 30px 0; padding: 20px; border-top: 2px solid #1e3a5f; border-bottom: 2px solid #1e3a5f;"
          >
            <h2 style="font-family: 'Playfair Display', serif; text-align: center; margin-bottom: 20px;">Order of Service</h2>
            <div class="service-item" style="margin: 15px 0;">
              <strong style="font-size: 18px;">Opening Prayer</strong>
              <p style="margin: 5px 0 0 20px; color: #555;">Led by Pastor Smith</p>
            </div>
            <div class="service-item" style="margin: 15px 0;">
              <strong style="font-size: 18px;">Eulogy</strong>
              <p style="margin: 5px 0 0 20px; color: #555;">Family Member</p>
            </div>
            <div class="service-item" style="margin: 15px 0;">
              <strong style="font-size: 18px;">Closing Remarks</strong>
              <p style="margin: 5px 0 0 20px; color: #555;">Pastor Smith</p>
            </div>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-list' },
      });

      blockManager.add('pallbearers', {
        label: 'Pallbearers List',
        content: `
          <div 
            class="pallbearers" 
            data-bind-array="pallbearers"
            style="margin: 20px 0; padding: 20px;"
          >
            <h3 style="font-family: 'Playfair Display', serif; text-align: center; margin-bottom: 15px;">Pallbearers</h3>
            <ul style="list-style: none; text-align: center; padding: 0;">
              <li style="margin: 5px 0;">John Smith</li>
              <li style="margin: 5px 0;">Bob Johnson</li>
              <li style="margin: 5px 0;">Mike Williams</li>
              <li style="margin: 5px 0;">David Brown</li>
              <li style="margin: 5px 0;">Tom Davis</li>
              <li style="margin: 5px 0;">James Wilson</li>
            </ul>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-users' },
      });

      blockManager.add('prayer-text', {
        label: 'Prayer Text',
        content: `
          <div 
            class="prayer-text" 
            style="margin: 20px 0; padding: 20px; text-align: center; font-style: italic;"
          >
            <h3 
              data-bind="prayerTitle" 
              style="font-family: 'Playfair Display', serif; margin-bottom: 15px;"
            >
              The Lord's Prayer
            </h3>
            <p 
              data-bind="prayerText"
              style="font-family: 'Inter', sans-serif; line-height: 1.8;"
            >
              Our Father, who art in heaven, hallowed be thy name. Thy kingdom come, thy will be done, on earth as it is in heaven...
            </p>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-book' },
      });

      blockManager.add('funeral-home-footer', {
        label: 'Funeral Home Info',
        content: `
          <div 
            class="funeral-home-footer" 
            style="margin-top: 40px; padding: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 14px;"
          >
            <p style="margin: 5px 0; font-weight: bold;" data-bind="funeralHomeName">Dykstra Funeral Home</p>
            <p style="margin: 5px 0;" data-bind="funeralHomeAddress">123 Main Street, Grand Rapids, MI 49503</p>
            <p style="margin: 5px 0;" data-bind="funeralHomePhone">(616) 555-1234</p>
          </div>
        `,
        category: 'Memorial Elements',
        attributes: { class: 'fa fa-building' },
      });

      editorRef.current = editor;
      setIsLoading(false);
    };

    initEditor();

    return () => {
      if (editor) {
        editor.destroy();
      }
      // Clear any pending preview timer
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current);
      }
    };
  }, [initialTemplate]);

  const handleSave = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.getHtml();
    const css = editor.getCss();

    const templateData: TemplateData = {
      htmlStructure: html,
      cssStyles: css || '',
      componentTree: editor.getComponents(),
      dataBindings: extractDataBindings(html),
    };

    onSave(templateData);
  };

  const handlePreview = () => {
    const editor = editorRef.current;
    if (!editor || !onPreview) return;

    const html = editor.getHtml();
    const css = editor.getCss();

    onPreview(html, css || '');
  };

  // Debounced preview trigger
  const triggerDebouncedPreview = useCallback(() => {
    if (!autoPreview || !onPreview) return;

    // Clear existing timer
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }

    // Set new timer
    previewTimerRef.current = setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const html = editor.getHtml();
      const css = editor.getCss();
      onPreview(html, css || '');
    }, autoPreviewDelay);
  }, [autoPreview, autoPreviewDelay, onPreview]);

  // Set up auto-preview listeners
  useEffect(() => {
    if (!autoPreview || !onPreview) return;

    const editor = editorRef.current;
    if (!editor) return;

    // Listen for editor changes
    const handleChange = () => {
      triggerDebouncedPreview();
    };

    editor.on('component:add', handleChange);
    editor.on('component:remove', handleChange);
    editor.on('component:update', handleChange);
    editor.on('style:update', handleChange);

    return () => {
      editor.off('component:add', handleChange);
      editor.off('component:remove', handleChange);
      editor.off('component:update', handleChange);
      editor.off('style:update', handleChange);
    };
  }, [autoPreview, onPreview, triggerDebouncedPreview]);

  return (
    <div className="template-editor-container">
      <div className="editor-toolbar" style={{ padding: '10px', borderBottom: '1px solid #ddd', display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleSave} 
          className="btn btn-primary"
          style={{ padding: '8px 16px', backgroundColor: '#1e3a5f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Save Template
        </button>
        <button 
          onClick={handlePreview}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', backgroundColor: '#8b9d83', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Preview PDF
        </button>
      </div>

      {isLoading && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading editor...
        </div>
      )}

      <div className="editor-wrapper" style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <div id="blocks-container" style={{ width: '250px', borderRight: '1px solid #ddd', overflow: 'auto' }}></div>
        <div id="gjs-editor" style={{ flex: 1 }}></div>
        <div className="right-panel" style={{ width: '300px', borderLeft: '1px solid #ddd', overflow: 'auto' }}>
          <div id="layers-container" style={{ padding: '10px' }}></div>
          <div id="styles-container" style={{ padding: '10px' }}></div>
          <div id="traits-container" style={{ padding: '10px' }}></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Extract Data Bindings
 * 
 * Parses HTML to find all data-bind attributes and extracts binding metadata.
 * Supports:
 * - Simple bindings: data-bind="deceasedName"
 * - Array bindings: data-bind-array="orderOfService"
 * 
 * Returns mapping of bind names to CSS selectors for runtime data application.
 */
function extractDataBindings(html: string): Record<string, { selector: string }> {
  if (typeof window === 'undefined') {
    // Server-side: Return empty bindings
    return {};
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const bindings: Record<string, { selector: string }> = {};

  // Extract simple data bindings
  doc.querySelectorAll('[data-bind]').forEach((el) => {
    const bindName = el.getAttribute('data-bind');
    if (bindName) {
      const className = el.className || 'unknown';
      bindings[bindName] = {
        selector: `[data-bind="${bindName}"]`,
      };
    }
  });

  // Extract array data bindings
  doc.querySelectorAll('[data-bind-array]').forEach((el) => {
    const bindName = el.getAttribute('data-bind-array');
    if (bindName) {
      bindings[bindName] = {
        selector: `[data-bind-array="${bindName}"]`,
      };
    }
  });

  return bindings;
}
