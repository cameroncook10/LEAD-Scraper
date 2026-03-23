import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Badge } from '../components/Badge';
import { Modal, useModal } from '../components/Modal';
import { api } from '../services/api';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const newTemplateModal = useModal();
  const editTemplateModal = useModal();
  const previewModal = useModal();

  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    body: '',
    variables: [],
    tags: []
  });

  const [previewData, setPreviewData] = useState({});
  const [previewResult, setPreviewResult] = useState(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await api.get('/templates');
        setTemplates(response.templates || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Handle form submission
  const handleSaveTemplate = async (e) => {
    e.preventDefault();

    try {
      if (selectedTemplate) {
        // Update
        const response = await api.put(`/templates/${selectedTemplate.id}`, formData);
        setTemplates(templates.map(t => t.id === selectedTemplate.id ? response.template : t));
      } else {
        // Create
        const response = await api.post('/templates', formData);
        setTemplates([response.template, ...templates]);
      }

      editTemplateModal.close();
      newTemplateModal.close();
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  // Handle preview
  const handlePreview = async (template) => {
    try {
      const response = await api.post(`/templates/${template.id}/preview`, {
        sampleData: previewData
      });
      setPreviewResult(response);
      previewModal.open();
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template?')) return;

    try {
      await api.delete(`/templates/${templateId}`);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Edit template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      body: template.body,
      variables: template.variables || [],
      tags: template.tags || []
    });
    editTemplateModal.open();
  };

  // New template
  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    resetForm();
    newTemplateModal.open();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'email',
      subject: '',
      body: '',
      variables: [],
      tags: []
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Message Templates</h2>
          <p className="text-slate-600 mt-1">Create reusable email, SMS, and WhatsApp templates</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleNewTemplate}
        >
          + New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-600">No templates yet. Create one to get started!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{template.name}</span>
                  <Badge variant="info">{template.type}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                  {template.body}
                </p>

                {template.variables && template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-700 mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map(v => (
                        <Badge key={v} size="sm" variant="default">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPreviewData({});
                      handlePreview(template);
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditTemplate(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      <Modal
        isOpen={newTemplateModal.isOpen || editTemplateModal.isOpen}
        onClose={() => {
          newTemplateModal.close();
          editTemplateModal.close();
          resetForm();
        }}
        title={selectedTemplate ? 'Edit Template' : 'Create New Template'}
        size="2xl"
      >
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g., Welcome Email"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="Message Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { label: 'Email', value: 'email' },
              { label: 'SMS', value: 'sms' },
              { label: 'WhatsApp', value: 'whatsapp' }
            ]}
            required
          />

          {formData.type === 'email' && (
            <Input
              label="Email Subject"
              placeholder="Subject line"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          )}

          <Textarea
            label="Message Body"
            placeholder="Use {{variable}} for dynamic content"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows="8"
          />

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tags
            </label>
            <Input
              placeholder="Enter tags separated by commas"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {selectedTemplate ? 'Update Template' : 'Create Template'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                newTemplateModal.close();
                editTemplateModal.close();
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModal.isOpen}
        onClose={previewModal.close}
        title="Template Preview"
        size="2xl"
      >
        <div className="space-y-4">
          {/* Sample Data Input */}
          {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700">Sample Data</p>
              {selectedTemplate.variables.map(variable => (
                <Input
                  key={variable}
                  label={variable}
                  value={previewData[variable] || ''}
                  onChange={(e) => setPreviewData({
                    ...previewData,
                    [variable]: e.target.value
                  })}
                  placeholder={`Enter sample ${variable}`}
                />
              ))}
              <Button
                variant="primary"
                size="sm"
                onClick={() => handlePreview(selectedTemplate)}
                className="w-full mt-3"
              >
                Update Preview
              </Button>
            </div>
          )}

          {/* Preview Result */}
          {previewResult && (
            <div className="space-y-3">
              {previewResult.subject && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Subject</p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                    {previewResult.subject}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Body</p>
                <div className="p-4 bg-white rounded-lg border border-slate-200 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {previewResult.body}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
