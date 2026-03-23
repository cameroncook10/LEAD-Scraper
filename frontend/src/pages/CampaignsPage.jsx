import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Badge, StatusBadge } from '../components/Badge';
import { Modal, useModal } from '../components/Modal';
import { StatCard, StatsGrid, MetricsList, ProgressBar } from '../components/Stats';
import { api } from '../services/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [templates, setTemplates] = useState([]);
  const newCampaignModal = useModal();
  const campaignDetailsModal = useModal();

  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    template_id: '',
    quality_threshold: 0.5,
    schedule_time: ''
  });

  // Fetch campaigns
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [campaignsRes, templatesRes] = await Promise.all([
          api.get('/campaigns'),
          api.get('/templates')
        ]);
        setCampaigns(campaignsRes.campaigns || []);
        setTemplates(templatesRes.templates || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/campaigns', {
        ...formData,
        quality_threshold: parseFloat(formData.quality_threshold),
        schedule_time: formData.schedule_time || null
      });

      setCampaigns([response.campaign, ...campaigns]);
      newCampaignModal.close();
      setFormData({
        name: '',
        type: 'email',
        template_id: '',
        quality_threshold: 0.5,
        schedule_time: ''
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  // View campaign details
  const handleViewCampaign = async (campaign) => {
    const response = await api.get(`/campaigns/${campaign.id}`);
    setSelectedCampaign(response.campaign);
    campaignDetailsModal.open();
  };

  // Send campaign
  const handleSendCampaign = async (campaignId) => {
    if (!confirm('Send this campaign to all recipients?')) return;

    try {
      const response = await api.post(`/campaigns/${campaignId}/send`);
      // Update campaign in list
      setCampaigns(campaigns.map(c =>
        c.id === campaignId ? { ...c, ...response.campaign } : c
      ));
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Delete this campaign?')) return;

    try {
      await api.delete(`/campaigns/${campaignId}`);
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  // Stats
  const stats = [
    {
      label: 'Total Campaigns',
      value: campaigns.length,
      icon: '📧'
    },
    {
      label: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'sent' || c.status === 'scheduled').length,
      icon: '🚀'
    },
    {
      label: 'Draft Campaigns',
      value: campaigns.filter(c => c.status === 'draft').length,
      icon: '📝'
    },
    {
      label: 'Total Recipients',
      value: campaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0),
      icon: '👥'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Campaigns</h2>
          <p className="text-slate-600 mt-1">Create and manage email, SMS, and WhatsApp campaigns</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={newCampaignModal.open}
        >
          + New Campaign
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} />

      {/* Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">All Campaigns</h3>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>All Types</option>
            <option>Email</option>
            <option>SMS</option>
            <option>WhatsApp</option>
          </select>
        </div>

        {campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-600">No campaigns yet. Create one to get started!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <Card
                key={campaign.id}
                hoverable
                className="flex items-center justify-between cursor-pointer hover:border-cyan-300"
              >
                <div className="flex-1" onClick={() => handleViewCampaign(campaign)}>
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">{campaign.name}</h4>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="info">{campaign.type}</Badge>
                        <StatusBadge status={campaign.status} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right pr-4">
                  <p className="text-sm text-slate-600">
                    {campaign.recipient_count} recipients
                  </p>
                  {campaign.sent_count > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {campaign.sent_count} sent
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                      >
                        Send
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {campaign.status === 'sent' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      View Stats
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      <Modal
        isOpen={newCampaignModal.isOpen}
        onClose={newCampaignModal.close}
        title="Create New Campaign"
        size="lg"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="e.g., Q1 Outreach"
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

          <Select
            label="Message Template"
            value={formData.template_id}
            onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
            options={templates.map(t => ({ label: t.name, value: t.id }))}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Lead Quality Threshold
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.quality_threshold}
              onChange={(e) => setFormData({ ...formData, quality_threshold: e.target.value })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-600">
              <span>Lowest</span>
              <span className="font-medium">{(formData.quality_threshold * 100).toFixed(0)}%</span>
              <span>Highest</span>
            </div>
          </div>

          <Input
            label="Schedule (Optional)"
            type="datetime-local"
            value={formData.schedule_time}
            onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
            help="Leave empty to send immediately"
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Create Campaign
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={newCampaignModal.close}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <Modal
          isOpen={campaignDetailsModal.isOpen}
          onClose={campaignDetailsModal.close}
          title={selectedCampaign.name}
          size="2xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Type</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {selectedCampaign.type.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <StatusBadge status={selectedCampaign.status} />
              </div>
            </div>

            {selectedCampaign.sent_at && (
              <ProgressBar
                label="Delivery Rate"
                value={selectedCampaign.sent_count}
                max={selectedCampaign.recipient_count}
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
