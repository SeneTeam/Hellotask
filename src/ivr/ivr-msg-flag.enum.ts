export enum IvrMessageFlag {
  worker_connecting = 'worker_connecting', // trying to connect to worker
  worker_connected = 'worker_connected', // comunication established with worker
  worker_accepted = 'worker_accepted', // worker accepted the order
  worker_rejected = 'worker_rejected', // Worker rejected oeder
  worker_cancelled = 'Worker_cancelled', // Worker cancelled the order after accepting
  work_cancelled = 'work_cancelled',

  worker_busy = 'worker_busy', // Worker is busy
  worker_no_answer = 'worker_no_answer', // Worker did not answer
  worker_not_reachable = 'worker_not_reachable', // workers' phone is off
  worker_not_available = 'worker_not_available', // all workers in that area has died

  worker_getting_task_reminder = 'worker_got_reminder', // worker got reminder
  worker_approaching_task_location = 'worker_approaching_task_location', // worker is approaching task location
  worker_delayed = 'worker_delayed', // worker is delayed
  worker_will_be_absent = 'worker_will_be_absent', // worker will be absent
  worker_started_task = 'worker_started_task', // worker started task

  worker_talking_to_customer = 'worker_talking_to_customer', // worker talked to customer
  worker_talking_to_office = 'worker_talking_to_office', // worker talked to office

  worker_completed_task = 'worker_completed_task', // worker completed task

  order_failed = 'order_failed', // order failed

  worker_on_the_way = 'worker_on_the_way', // worker is on the way
}
