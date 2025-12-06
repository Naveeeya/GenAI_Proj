"""
Pathway Streaming Transformations for Delay Detection
Simplified version for Pathway 0.2.0 compatibility
"""

import pathway as pw
from typing import Optional
import time


def monitor_velocity_windows(gps_stream: pw.Table) -> pw.Table:
    """
    Apply aggregations to calculate velocity statistics.
    
    Simplified approach for Pathway 0.2.0 - uses groupby aggregations.
    
    Args:
        gps_stream: Input GPS stream from Team A
        
    Returns:
        Table with velocity statistics per truck
    """

    # Group by truck_id and calculate velocity statistics
    velocity_window = (
        gps_stream
        .groupby(pw.this.truck_id)
        .reduce(
            truck_id=pw.this.truck_id,
            avg_velocity=pw.reducers.avg(pw.this.velocity),
            min_velocity=pw.reducers.min(pw.this.velocity),
            max_velocity=pw.reducers.max(pw.this.velocity),
            current_velocity=pw.reducers.any(pw.this.velocity),
            current_lat=pw.reducers.any(pw.this.lat),
            current_lon=pw.reducers.any(pw.this.lon),
            driver=pw.reducers.any(pw.this.driver),
            cargo_value=pw.reducers.any(pw.this.cargo_value),
            contract_id=pw.reducers.any(pw.this.contract_id),
            route=pw.reducers.any(pw.this.route)
        )
    )

    return velocity_window


def detect_delays(velocity_stream: pw.Table) -> pw.Table:
    """
    Detect delays based on velocity thresholds.
    
    Status levels:
    - on-time: velocity >= 40 km/h
    - delayed: 10 <= velocity < 40 km/h
    - critical: velocity < 10 km/h
    
    Args:
        velocity_stream: Stream with velocity data
        
    Returns:
        Table with status field added
    """

    def calculate_status(velocity: float) -> str:
        """Determine truck status based on current velocity"""
        if velocity < 10:
            return 'critical'
        elif velocity < 40:
            return 'delayed'
        else:
            return 'on-time'

    # Apply status calculation
    status_stream = velocity_stream.select(
        pw.this.truck_id,
        pw.this.driver,
        current_lat=pw.this.current_lat,
        current_lon=pw.this.current_lon,
        current_velocity=pw.this.current_velocity,
        avg_velocity=pw.this.avg_velocity,
        min_velocity=pw.this.min_velocity,
        max_velocity=pw.this.max_velocity,
        cargo_value=pw.this.cargo_value,
        contract_id=pw.this.contract_id,
        route=pw.this.route,
        status=pw.apply(calculate_status, pw.this.current_velocity)
    )

    return status_stream


def generate_delay_events(status_stream: pw.Table) -> pw.Table:
    """
    Generate events when truck status changes.
    
    This creates an event stream for the frontend event log.
    
    Args:
        status_stream: Stream with status field
        
    Returns:
        Table of events (status changes, alerts)
    """

    # Filter for delayed or critical trucks
    problematic_trucks = status_stream.filter(
        (pw.this.status == 'delayed') | (pw.this.status == 'critical')
    )

    # Create event messages
    events = problematic_trucks.select(
        event_id=pw.apply(lambda tid: f"evt-delay-{tid}", pw.this.truck_id),
        truck_id=pw.this.truck_id,
        event_type=pw.if_else(
            pw.this.status == 'critical',
            'alert',
            'warning'
        ),
        severity=pw.this.status,
        message=pw.apply(
            lambda tid, vel, status: f"⚠️ {tid} {status.upper()} - Velocity: {vel:.1f} km/h",
            pw.this.truck_id,
            pw.this.current_velocity,
            pw.this.status
        ),
        timestamp=pw.apply(lambda tid: int(time.time()), pw.this.truck_id)
    )

    return events


def calculate_eta(status_stream: pw.Table) -> pw.Table:
    """
    Calculate estimated time of arrival based on current position and velocity.
    
    Simplified calculation for demo purposes.
    
    Args:
        status_stream: Stream with position and velocity data
        
    Returns:
        Table with ETA field added
    """

    def estimate_eta(velocity: float, cargo_value: int) -> float:
        """
        Estimate hours to destination.
        Simplified: assumes 150km average distance
        """
        if velocity < 5:
            return 999.0  # Essentially stopped

        distance_km = 150  # Simplified assumption
        eta_hours = distance_km / velocity
        return round(eta_hours, 2)

    eta_stream = status_stream.select(
        pw.this.truck_id,
        pw.this.driver,
        pw.this.current_lat,
        pw.this.current_lon,
        pw.this.current_velocity,
        pw.this.avg_velocity,
        pw.this.min_velocity,
        pw.this.max_velocity,
        pw.this.cargo_value,
        pw.this.contract_id,
        pw.this.route,
        pw.this.status,
        eta_hours=pw.apply(estimate_eta, pw.this.current_velocity, pw.this.cargo_value)
    )

    return eta_stream


# Main pipeline function that combines all transformations
def apply_all_transformations(gps_stream: pw.Table) -> tuple:
    """
    Apply complete transformation pipeline.
    
    Args:
        gps_stream: Raw GPS data from Team A
        
    Returns:
        Tuple of (status_stream, events_stream)
    """

    # Step 1: Velocity monitoring with aggregations
    velocity_window = monitor_velocity_windows(gps_stream)

    # Step 2: Detect delays
    status_stream = detect_delays(velocity_window)

    # Step 3: Calculate ETAs
    eta_stream = calculate_eta(status_stream)

    # Step 4: Generate events
    events = generate_delay_events(status_stream)

    return eta_stream, events
