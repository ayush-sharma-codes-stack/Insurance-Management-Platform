import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Upload, FileText, Trash2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Documents() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'AGENT';

  const [documents, setDocuments] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
    if (isStaff) {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomersList(res.data.data.items);
      if (res.data.data.items.length > 0) {
        setSelectedCustomerId(res.data.data.items[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    if (droppedFile) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(droppedFile.mimetype || droppedFile.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const targetCustId = isStaff ? selectedCustomerId : user?.customerId;
    if (!targetCustId) {
      toast.error('Customer association required');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('customerId', targetCustId);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded successfully');
      setFile(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File download started');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Document Repository</h2>
        <p className="text-xs text-slate-400 mt-1">Upload and manage identity proof, policy forms, and claim evidence</p>
      </div>

      {/* Drag & Drop File Upload Component */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Upload New Document</h3>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {isStaff && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Associate Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-8 text-center transition bg-slate-900/40 cursor-pointer relative"
          >
            <input
              type="file"
              onChange={handleFileDrop}
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="inline-flex p-3 bg-blue-500/10 text-blue-400 rounded-2xl mb-3 border border-blue-500/20">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Drag & drop file here, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG up to 5MB</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition disabled:opacity-40"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Documents Grid / List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Uploaded Documents</h3>

        {loading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No documents found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <p className="text-xs font-bold text-white truncate">{doc.fileName}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">Customer: {doc.customer?.name}</p>
                  <p className="text-[11px] text-slate-500">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => handleDownload(doc.id, doc.fileName)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isStaff && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
