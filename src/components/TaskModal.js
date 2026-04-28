import React, { useState, useEffect } from 'react';

const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  projects = [],
  users = [],
  tasks = [],
  taskTypes = [],
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    taskItemId: task?.taskItemId || 0,
    projectId: task?.projectId || '',
    name: task?.name || '',
    description: task?.description || '',
    status: task?.status || 'Not Started',
    priority: task?.priority || 'Medium',
    startDate: task?.startDate ? task.startDate.split('T')[0] : '',
    endDate: task?.endDate ? task.endDate.split('T')[0] : '',
    assignedToUserId: task?.assignedToUserId || '',
    taskTypeId: task?.taskTypeId || '',
    parentTaskId: task?.parentTaskId || '',
    predecessorTaskId: task?.predecessorTaskId || '',
    budgetAtCompletion: task?.budgetAtCompletion || 0,
    overheadCosts: task?.overheadCosts || 0,
    plannedWorkPercentage: task?.plannedWorkPercentage || 0,
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // Multi-step: 1=Basic, 2=Dates & Assignment, 3=Budget

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Task name is required';
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (!formData.taskTypeId) newErrors.taskTypeId = 'Task type is required';
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.budgetAtCompletion < 0) newErrors.budgetAtCompletion = 'Budget must be non-negative';
    if (formData.plannedWorkPercentage < 0 || formData.plannedWorkPercentage > 100) {
      newErrors.plannedWorkPercentage = 'Planned work must be 0-100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const dialogStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle = {
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const bodyStyle = {
    padding: '24px',
  };

  const footerStyle = {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    backgroundColor: '#f9fafb',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#1f2937',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    marginBottom: '4px',
  };

  const errorStyle = {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
    marginBottom: '12px',
  };

  const formGroupStyle = {
    marginBottom: '16px',
  };

  const buttonStyle = {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#374151',
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={bodyStyle}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Task Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.name ? '#ef4444' : '#d1d5db',
                    }}
                    placeholder="Enter task name"
                  />
                  {errors.name && <div style={errorStyle}>{errors.name}</div>}
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Project *</label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.projectId ? '#ef4444' : '#d1d5db',
                    }}
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && <div style={errorStyle}>{errors.projectId}</div>}
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      minHeight: '100px',
                      resize: 'vertical',
                    }}
                    placeholder="Add task description or notes"
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Task Type</label>
                  <select
                    name="taskTypeId"
                    value={formData.taskTypeId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Select task type</option>
                    {taskTypes.map((type) => (
                      <option key={type.taskTypeId} value={type.taskTypeId}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.taskTypeId && <div style={errorStyle}>{errors.taskTypeId}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Dates & Assignment */}
            {step === 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label style={labelStyle}>End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      style={{
                        ...inputStyle,
                        borderColor: errors.endDate ? '#ef4444' : '#d1d5db',
                      }}
                    />
                    {errors.endDate && <div style={errorStyle}>{errors.endDate}</div>}
                  </div>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Assigned To</label>
                  <select
                    name="assignedToUserId"
                    value={formData.assignedToUserId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.userNumber} value={u.userNumber}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Parent Task (Subtask)</label>
                  <select
                    name="parentTaskId"
                    value={formData.parentTaskId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">None (Root Task)</option>
                    {tasks
                      .filter((t) => t.projectId === parseInt(formData.projectId))
                      .map((t) => (
                        <option key={t.taskItemId} value={t.taskItemId}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Predecessor Task (Dependencies)</label>
                  <select
                    name="predecessorTaskId"
                    value={formData.predecessorTaskId}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {tasks
                      .filter(
                        (t) =>
                          t.projectId === parseInt(formData.projectId) &&
                          t.taskItemId !== formData.taskItemId
                      )
                      .map((t) => (
                        <option key={t.taskItemId} value={t.taskItemId}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}

            {/* Step 3: Budget & Planning */}
            {step === 3 && (
              <>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Budget at Completion (BAC)</label>
                  <input
                    type="number"
                    name="budgetAtCompletion"
                    value={formData.budgetAtCompletion}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.budgetAtCompletion ? '#ef4444' : '#d1d5db',
                    }}
                    placeholder="0"
                    step="0.01"
                  />
                  {errors.budgetAtCompletion && (
                    <div style={errorStyle}>{errors.budgetAtCompletion}</div>
                  )}
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Overhead Costs</label>
                  <input
                    type="number"
                    name="overheadCosts"
                    value={formData.overheadCosts}
                    onChange={handleChange}
                    style={inputStyle}
                    placeholder="0"
                    step="0.01"
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Planned Work Percentage (%)</label>
                  <input
                    type="number"
                    name="plannedWorkPercentage"
                    value={formData.plannedWorkPercentage}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      borderColor: errors.plannedWorkPercentage ? '#ef4444' : '#d1d5db',
                    }}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                  {errors.plannedWorkPercentage && (
                    <div style={errorStyle}>{errors.plannedWorkPercentage}</div>
                  )}
                </div>
              </>
            )}

            {/* Step Indicator */}
            <div
              style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Dates & Assignment' : 'Budget'}
            </div>
          </div>

          <div style={footerStyle}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={secondaryButtonStyle}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                style={primaryButtonStyle}
              >
                Next
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  style={secondaryButtonStyle}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={primaryButtonStyle}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Task'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
