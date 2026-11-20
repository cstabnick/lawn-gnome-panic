# Scalable game driving physics models (research)

Background research for `packages/vehicle` (`@lawn/vehicle`, see its README). Pasted from the source text as-is: the display equations were images and are missing, and the superscript numbers are citation indexes into "Works cited" at the end. The package implements this; where it falls short is listed in `packages/vehicle/README.md`.

---

﻿Scalable Game Driving Mechanics: Industry Architectures, Physics Modeling, and Mobile-Ready POC Specification
Building a single vehicle model that delivers authentic weight transfer and tire breakaway in a driving-centric game—yet scales smoothly down for casual mobile titles where driving is a secondary mechanic—hinges on solving one architectural failure mode: preventing arcade handling aids from fighting the underlying physics solver. Rather than maintaining two codebases or bolting artificial yaw torques onto a rigid tire simulation (a dual-system conflict that creates unpredictable, brittle tuning1), the most resilient architecture is a single-RigidBody, four-wheel raycast chassis split into five decoupled layers: (1) device-adaptive input conditioning, (2) a subtractive and bounded driver-assist stack, (3) a swappable drivetrain interface (six-speed combustion versus five-parameter direct drive), (4) a parametric suspension and tire core with scalable load transfer, and (5) decoupled visual, camera, audio, and haptic presentation2.
Under this unified stack, scaling downward from realistic "simcade" dynamics to accessible arcade play requires continuous parameter morphing and module swaps rather than solver rewrites. Flattening the post-peak drop-off of a simplified four-parameter Pacejka tire curve, damping dynamic weight transfer via a wheelLoadRatio scalar, lowering effective center-of-mass height and force application height, swapping a multi-gear transmission for a five-parameter electric/direct-drive motor, and activating speed-curvature steering limits alongside coordinated traction and yaw stability assists convert a demanding rear-wheel-drive sports car into a forgiving mobile cruiser on the same 60 Hz physics loop1.
Four engineering constraints govern a mobile-ready proof of concept (POC). First, vehicle physics must execute on a fixed timestep (50–60 Hz) decoupled from rendering to stay within mobile CPU and thermal budgets without frame-rate-dependent handling drift1. Second, classical dimensionless slip-ratio tire equations divide by zero at standstill and oscillate on slopes unless stabilized through relaxation-length dynamics or a split rolling/spinning wheel integrator5. Third, our 60 Hz verification simulations demonstrate that limiting front steering angle alone on binary mobile touch inputs actually worsens full-throttle rear-wheel-drive spinouts unless paired with friction-circle traction control and yaw stability control9. Fourth, empirical mobile human-computer interaction (HCI) research reveals a genuine split between immersion and precision: tilt controls raise third-person racing immersion, whereas thumbsticks and position-mapped touch interfaces yield substantially higher speed, lower fatigue, and broader usability14. Control layout and assist strength must therefore operate as independent, player-selectable configuration layers.
How Games Implement Driving Across the Realism Spectrum
Game studios rarely select a vehicle simulation model solely by automotive accuracy; they select the minimum physical complexity that sustains their core gameplay fantasy while remaining controllable across target input devices and level geometry2. Across commercial games and physics engines, implementations organize into five architectural tiers.


Architecture Tier
	Representative Titles & Engines
	Collision & Suspension Model
	Tire & Drivetrain Model
	Key Engineering Strengths
	Primary Failure Modes & Trade-Offs
	1. Rolling-Sphere / Kinematic Arcade
	Mario Kart-style kart controllers, Kenney / KidsCanCode sphere car17
	Single rolling sphere RigidBody; detached visual mesh; 1 downward raycast for slope-normal alignment19
	Central propulsion force + lerped mesh yaw; explicit state machine for hop/drift/boost1
	Trivially stable, immune to rollovers or wheel snagging, rapid mobile prototyping17
	Zero genuine weight transfer, no per-wheel curb response, steering disabled cleanly in air or near standstill19
	2. Simplified Force Raycast Arcade
	Rocket League2, Space Dust Racing20, Very Very Valet22
	Single BoxCollider RigidBody + 4 corner suspension raycasts (springs + dampers)17
	Three forces per wheel; speed-normalized torque curve (no gears); simplified lateral slip curve; forces often applied at CM height2
	Crisp designer control, low parameter count, high determinism (Rocket League runs Bullet at 120 Hz)2
	Lacks authentic shifting, clutch, and differential dynamics or nuanced limit-balance feel2
	3. Tuned Open-World Hybrid
	GTA V25, Uncharted 428, Just Cause 41, Halo Warthog30, Cyberpunk 207732
	Single RigidBody chassis + 4 raycasts or shape sweeps; stiff anti-roll bars, lowered CoM, sub-suspension penetration handling24
	Data-driven min/max traction curves (handling.meta) or simplified high-grip non-Pacejka curves; gears, ABS, and stability aids1
	Conveys grounded vehicle weight across diverse terrain while forgiving casual play; supports huge vehicle rosters via presets27
	Large tuning surface (over 70 parameters documented in GTA V modding guides); poorly smoothed binary inputs feel icy or twitchy25
	4. High-Frequency Simcade & Modular Engines
	Forza Motorsport / Horizon36, NVIDIA PhysX 53, Jolt Physics39, UE5 Chaos1, Vehicle Physics Pro4
	Multi-point or cylindrical sweep queries (Forza Motorsport 2023 uses 8 tire contact points at 360 Hz); sprung-mass suspension + ARBs3
	Pacejka, Brush, or slip-velocity tire curves with combined slip; engine/clutch/gearbox/LSD propagation; hidden gamepad assists3
	Deep cornering physics, authentic mechanical behavior, telemetry support, scales from gamepad to steering wheel4
	Tightly coupled variables; forcing stylized arcade drifts fights the underlying tire slip solver1
	5. Full Multi-Body / Soft-Body Simulation
	Assetto Corsa (333 Hz engine clock per community modding manual)43, BeamNG.drive (2,000 Hz)44
	Articulated multi-link linkages or mass-spring-damper soft-body meshes (typically 600–1,200 nodes per car in BeamNG tooling)44
	Deformable structural chassis and tire dynamics with decoupled high-level powertrain/controller layer44
	Unmatched structural crash deformation, linkage kinematics, and R&D fidelity44
	Prohibitive CPU, memory, and authoring cost for mobile games or non-driving-centric titles44
	Production Lessons From Shipped Titles
GDC postmortems and developer breakdowns highlight five production principles that generalize directly to a scalable controller. First, divorce physics geometry from visual art assets. In Rocket League, Psyonix initially allowed artists to place wheel offsets per car model, causing visual variations to break competitive handling consistency and slow iteration2. Switching to a small library of standardized Physics Presets (box collider dimensions, wheel positions, and radii), applying tire forces at center-of-mass height to prevent tipping, and faking chassis tilt in animation enabled rapid tuning across dozens of car shells2.
Second, avoid empirical tire complexity that does not serve gameplay. At GDC 2019, Avalanche Studios' lead mechanics designer Hamish Young detailed how Just Cause 4 retained simulation-style input parameters while replacing Pacejka's Magic Formula with simpler, higher-grip tire dynamics suited to high-speed open-world stunts1. Toyful Games' developer breakdown of Very Very Valet pushed simplification even further: one rigid body with three independent scalar forces per raycast wheel—a spring-damper vertical force, a lateral traction lookup curve indexed by sideways velocity share, and a speed-normalized torque curve—delivering playful, immediate handling without simulating gears or tire spin23.
Third, encode stability and vehicle identity inside data-driven chassis presets. Rockstar's handling.meta system in GTA V—analyzed extensively by the FiveM modding community (which flags minor disputed fields where community wikis disagree25)—parameterizes street sedans, drift builds, off-roaders, and heavy rigs across more than 70 fields on a single solver25. Modding and tuning guides highlight two primary stability levers: lowering vecCentreOfMassOffset.z (typically -0.2 to 0.1) paired with fAntiRollBarForce to prevent flips, and tuning the spread between fTractionCurveMax (1.8–3.0) and fTractionCurveMin (1.5–2.5) to control how loosely a car breaks into a slide26.
Fourth, layer invisible input and yaw-inertia assists atop a realistic core rather than dumbing down the core. Criterion Games' GDC 2018 Vehicle Feel Masterclass divides vehicle feel cleanly into three tiers: Input Layer, Simulation, and Assists51. Turn 10's Forza franchise demonstrates this separation in practice: Forza Motorsport (2023) expanded tire contact from 1 point at 60 Hz to 8 points at 360 Hz (a 48× contact-fidelity increase, per Turn 10's Chris Esaki37; community comments also report 8-point 360 Hz simulation in Forza Horizon 6, though that specific title detail is unverified outside forum discussion54). Despite that simulation fidelity, Forza remains approachable on a thumbstick because official Forza documentation explains that "Normal Steering" stacks multiple input-filtering and yaw-inertia damping layers over the chassis—layers that automatically turn off when using a steering wheel or selecting "Simulation Steering"36.
Fifth, beware modal drift rails and unconditioned binary controls. Criterion and Ghost Games' Need for Speed "Brake-to-Drift" handling divides driving into three explicit stages—non-drifting, transitioning, and drifting56—which lowers the execution floor for casual players57, yet community feedback repeatedly flags accidental drift triggers on straights, difficulty braking cleanly mid-corner, and a disconnected "on rails" sensation56. Conversely, Cyberpunk 2077's initial release illustrated what happens when a grounded physics model receives raw binary keyboard taps (instant full lock) and frame-rate-coupled steering, drawing heavy player criticism for twitchy, center-pivoting handling34. CD Projekt RED addressed those complaints across Patches 1.2 and 1.5 by adding a steering sensitivity slider, frame-rate-independent steering, ABS, clutch and downshift resistance, and an unstuck vehicle-rocking mechanic32. Meanwhile, Halo's Warthog popularized camera-directed steering combined with four-wheel steering to make FPS vehicle navigation effortless30, though player discussions around Halo and Starfield underscore that players strongly prefer an opt-out toggle to separate camera look from steering61.
Built-In Physics Engine Vehicle Solutions
Before building a custom POC controller, engine-native vehicle modules offer important architectural patterns—and known pitfalls—to evaluate.


Engine / SDK
	Contact & Suspension Approach
	Drivetrain & Tire Strengths
	Key Pitfalls & Patterns to Adopt
	Unity WheelCollider63
	Single downward raycast along local Y; ignores standard PhysicsMaterial65
	Two-piece spline WheelFrictionCurve (extremum & asymptote slip/value + stiffness); ConfigureVehicleSubsteps63
	Historical curve-fitting quirks can cause tripping on high side-slip; single rays jump abruptly over sharp curbs; many studios replace it with custom raycast scripts67
	UE5 Chaos Vehicles1
	Configurable ray, sphere, or wheel-shape sweeps; async fixed physics tick1
	Full emergent engine-gearbox-differential chain; WheelLoadRatio cleanly scales dynamic load sensitivity to cure lift-off oversteer1
	Stacking Arcade Control direct yaw torques on top of Chaos tire slip causes dual-system fighting1
	NVIDIA PhysX 5.1+ SDK3
	Swappable raycasts or cylindrical PxConvexMesh sweeps; decoupled from scene actor3
	Modular component sequences sharing uniform state structs; clean swap between DirectDrive and EngineDrivetrain; low-speed sticky-tire deactivation via substepping3
	Best-in-class component modularity blueprint for separating powertrain complexity from chassis physics3
	Jolt Physics VehicleConstraint39
	Selectable Ray, CastSphere, and CastCylinder testers; Marco Monster lineage40
	Linear longitudinal/lateral friction curves; explicit mMaxPitchRollAngle anti-flip cone; mEnableSuspensionForcePoint for stable force pinning39
	Anti-flip cone and configurable force-application point are lightweight, clean stability primitives to adopt directly39
	Vehicle Physics Pro (VPP)4
	Per-vehicle local solver substeps (1–8 substeps low CPU cost) inside standard 50 Hz engine step72
	Decoupled tree of powertrain blocks passing angular momentum, inertia, and reaction torque (L-I-Tr) upstream and drive torque downstream; slip-velocity curve (Adherent, Peak, Limit)4
	TireImpulseRatio (0.5 default, 0.3–0.4 for tall vehicles) tames CoM-offset jitter; Steering Limit aid demonstrates keeping slip near peak friction41
	Foundational Vehicle Dynamics and Simulation Research
Four areas of automotive dynamics, numerical integration, and mobile HCI research underpin a mathematically sound and adaptable controller.
Ackermann Geometry and the Dynamic Bicycle Model
In low-speed cornering without tire scrub, the inner front wheel follows a tighter arc than the outer front wheel so that all four wheel axes meet at a single Instantaneous Center of Rotation (ICR)74. Standard geometric derivations express this via cotangents (  ), which divide by zero when driving straight75. Clearing fractions yields Robert Eisele's singularity-free, computationally cheap form75:
  

where    is wheelbase,    is track width, and    is the center steering angle75. At higher speeds, pneumatic tires flex and operate at nonzero slip angles (  ), transitioning handling into the Dynamic Bicycle Model76. Linearizing axle lateral forces (  ,   ) defines the understeer gradient    (in   )76:
  

where    is total mass,    and    are CG-to-axle lever arms, and    are front and rear axle cornering stiffnesses76. For game tuning, maintaining    guarantees inherent understeer stability (  ), so the vehicle gently pushes wide at its cornering limit instead of snapping into an uncontrollable spin. Furthermore, substituting steady-state lateral acceleration    into the steady-state bicycle steering law    yields a clean target yaw rate for Electronic Stability Control (ESC)9:
  

Comparing Game Tire Formulations
Because tire curves govern cornering sharpness, breakaway forgiveness, and acceleration traction, selecting a formulation that is physically coherent yet effortless to reshape is central to scaling across genres.


Tire Model
	Source Lineage
	Core Inputs & Parameters
	Strengths for Scalable Games
	Limitations & Tuning Pitfalls
	Linear + Clamped Normalized Curve
	Marco Monster (Car Physics for Games)79
	Cornering stiffness   , friction   , slip angle   , slip ratio   
	Minimal compute, transparent analytical weight-transfer math79
	Lacks authentic post-peak falloff at handling limits; original formulation was 2D and modeled weight transfer analytically rather than via 3D suspension81
	Full Pacejka '94 Magic Formula
	Hans Pacejka; Edy Garcia reference7
	14 longitudinal (  –  ) and 18 lateral (  –  ) coefficients,    in kN, camber   7
	Captures load sensitivity, camber thrust, and empirical tire-test data7
	Passing    in N instead of kN explodes forces into millions of Newtons; out-of-range coefficients generate non-physical curves; hostile to designer tuning7
	Simplified 4-Parameter Pacejka
	Simplified Magic Formula7
	  
 (stiffness),    (shape),    (peak   ),    (curvature);    in N7
	Optimal scalable choice: four intuitive scalars morph a crisp sport-tire breakaway smoothly into a flat, non-snapping arcade plateau7
	Needs explicit combined-slip friction circle and low-speed regularization7
	Theoretical Brush Model
	Mid-20th-century brush theory; GDSim implementation84
	Three physical variables:   , contact patch length (0.15–0.25 m), tire_stiffness84
	Derives combined longitudinal/lateral slip naturally from bristle deflection84
	Less flexible than Pacejka or splines for shaping arbitrary casual post-peak plateaus84
	Slip-Velocity Piecewise Curve
	Vehicle Physics Pro (VPP)41
	Contact-patch slip speed (m/s); 3 points: Adherent   , Peak   , Limit   41
	Avoids dimensionless ratio division-by-zero near rest; isotropic combined slip41
	Peak slip angle narrows as vehicle speed rises unless paired with a steering-limit aid41
	Solving Low-Speed Tire Singularities and Discrete Spring Instability
Dropping naive textbook physics into a 50–60 Hz mobile game loop triggers two classic numerical instabilities: standstill tire jitter on slopes and suspension spring blow-ups5.
Classical longitudinal slip ratio    and slip angle    become singular or hyper-sensitive as   5. Because a stiff tire transitions from zero force to peak friction across millimeters of tread displacement, explicit Euler integration at 50–60 Hz causes parked wheels to overshoot between positive and negative grip every step—making stationary vehicles shiver and slowly creep downhill5. Research and production physics libraries solve this through three complementary mechanisms. First, Bernard and Clover (1995, 1998) replaced algebraic slip with a first-order differential equation governed by tire relaxation length    (typically 0.091 m longitudinal and 0.91 m lateral in automotive validation, or tightened down to 0.007–0.15 m in games for crisp responsiveness8):
  

At driving speed, steady-state    converges exactly to classical slip   89. At standstill (  ),    vanishes and    integrates wheel displacement directly—behaving like an elastic rubber spring that holds the car parked on an incline, provided low-speed tire damping is included to settle the resulting ~3.5 Hz oscillation9. Second, modern state-estimation models regularize transport velocity via   83 or a smooth low-speed quadratic denominator   82. Third, PrototypeEverything's Vehicle Fundamentals architecture separates wheel angular velocity into a Rolling state (resetting to road speed plus single-step drive torque so stiff reaction torques never oscillate) and an Own Spin state (integrating free wheel + driveline inertia only when broken loose or airborne), while applying brake torque last via moveTowards(omega, 0, maxDelta) so brakes stop rotation cleanly at exact zero without reversing the wheel5.
Suspension instability follows an equally exact mathematical boundary. Hooke's-law spring-dampers (  ) explode not simply because explicit Euler fails, but because stiffness    or damping    exceeds the discrete single-step equilibrium limit for a corner mass    and timestep   87:
  

Monitoring dimensionless stiffness    and damping    against    (roughly 0.20 for four coupled springs on one body,   ) guarantees stable suspension tuning across varying vehicle masses and mobile frame rates without trial-and-error guesswork87.
Empirical Mobile HCI Findings: Position Control vs. Tilt Immersion
Published mobile HCI studies demonstrate why console-derived control logic often frustrates smartphone players. Controlled mobile tilt experiments (2014) comparing position-control (mapping tilt angle directly to target position/angle) against velocity-control (mapping tilt to rate of change) found position-control roughly 2× faster (mean movement time 1,555 ms vs. 3,095 ms), nearly triple the throughput (3.3 bps vs. 1.2 bps), roughly 2× higher game-level progression (8.6 vs. 4.2 for tilt; 5.7 vs. 4.6 for touch), substantially fewer errors (velocity-control miss rates were 42% higher), and markedly lower forearm fatigue14. Remarkably, in a companion marble-maze experiment, 10 of 12 participants (83.3%) subjectively preferred velocity-control even while performing 16.2% slower with it92. For driving games, tilt and virtual thumbsticks should therefore map as position-control directly onto target steering angle rather than steering angular rate.
At the same time, user studies expose a sharp trade-off between immersion and usability across game perspectives. In a 2014 CHI study by Cairns et al. testing 30 adults on the 3D third-person mobile racer Beach Buggy Blitz, tilt controls produced significantly higher immersion than touch buttons across four of five Immersive Experience Questionnaire (IEQ) subscales (total IEQ 100.5 vs. 85.1, p < 0.01, Cohen's d = 1.03), attributed to the natural analogy of turning a steering wheel, even though perceived Control (p = 0.472) and race scores (2,690 vs. 2,359, p = 0.254) did not differ significantly15. Conversely, a 2019 usability study evaluating five control schemes in a 2D top-down racing game (n = 24 children aged 6–14) found thumbsticks overwhelmingly preferred while tilt ranked dead last (14 of 24 worst votes) because participants could not hold a stable sensitivity "sweet spot" and repeatedly spun out16. Notably, inexperienced players strongly preferred a single joystick with automatic/distance-based speed, whereas 5 of 8 experienced racing players preferred a joystick paired with a discrete acceleration button16. Taken together, these findings—mindful of their distinct age and camera-perspective contexts—indicate that no single mobile input scheme suits every game or player.
Unified Scalable Driving Architecture
To deliver both realistic dynamics and effortless casual adaptation inside one maintainable codebase, each subsystem must communicate strictly through normalized state structs rather than injecting competing forces across layers3. The five-layer stack below synthesizes proven decoupling patterns from Criterion Games, NVIDIA PhysX 5, Vehicle Physics Pro, and PrototypeEverything into a unified blueprint ready for POC implementation3.
  

Four architectural invariants keep this five-layer design clean across every preset. First, simulate one RigidBody chassis with zero jointed wheel bodies: physics-jointed wheel colliders introduce solver instability, wheel clipping, and unnecessary mobile CPU overhead, whereas four virtual raycasts (optionally upgraded to spherecasts) apply clean forces directly onto one box/convex body21. Second, keep assists subtractive or physically bounded so they never fight the tire model: shaping steering angles inside peak tire slip, capping drive torque inside the friction circle, and applying proportional yaw-error damping preserve the tires as the single source of physical truth (whereas stacking uncoupled artificial yaw torques onto an active tire model causes dual-system fighting1). Third, enforce one uniform drivetrain contract: both a six-speed combustion powertrain and a five-parameter electric/direct-drive motor output axle drive torque, engine/regen braking, reflected driveline inertia, and normalized RPM, letting casual projects bypass shifting and clutch bugs completely3. Fourth, decouple visual body tilt from physical center of mass: casual presets lower physical CoM and raise tire force application height to stop rollovers, while Layer 5 reads chassis acceleration telemetry to animate lively visual pitch, squat, dive, and body roll on the child car mesh2.
Core Physics and Mathematical Model (POC Specification)
All equations below use strict SI units (meters, kilograms, seconds, radians, Newtons, N·m) and can be ported directly to Unity, Unreal, Godot, Jolt, Bullet, or a custom physics loop5.
Ground Contact, Coordinate Frames, and Moving Platforms
Each of the four wheels (  ) starts from a local upper suspension mount    positioned strictly inside the chassis collision box5. Starting a ray origin outside the collider allows hard landings to push the mount beneath terrain geometry, causing raycasts to miss the floor and preventing suspension recovery96.
In every fixed step, apply Ackermann steering first so the inner front wheel turns sharper than the outer wheel around one shared turning center5. Then cast a ray (or wheel-radius spherecast for smooth curb climbing5) downward along the vehicle body's local up axis   —never world down, so ramps and banked roads remain supported—with reach   5. If ungrounded, set spring length    and zero contact forces5. When grounded at hit distance    and road normal   , compute spring length    and compression   5. Rotate the chassis forward vector around    by the wheel's steer angle    to get wheel heading   , then project it onto the sloped road plane to construct three mutually perpendicular force axes—Suspension Force upward along   , Drive/Brake Force forward along   , and Lateral Grip Force sideways along   5:
  

Before evaluating damping or tire slip, subtract the contacted ground body's point velocity (zero for static terrain) so parked vehicles ride naturally on ferries, lifts, and turntables without generating phantom tire slip5:
  

Suspension Spring-Damper, Anti-Roll Bar, and Scalable Weight Transfer
Compute suspension compression speed    directly from relative body velocity rather than frame-to-frame length deltas, preventing artificial damper spikes on respawns or moving platforms5. On ground tilted beyond 3° (  ), smoothly interpolate between strut-axis velocity and the exact normal-projected ray-shortening rate (reaching full exact mode by 10°,   ) so high-speed ramps do not trigger false damper pull5:
  

Combine linear spring stiffness with asymmetric damping—softer bump damping (damping ratio    around 0.25–0.35 on road cars) to absorb hits and firmer rebound damping (   around 0.45–0.60) to prevent floating bounce9—plus a progressive bump stop    for deep compressions, clamping the final force at zero so raycast wheels never pull the car downward over jumps3:
  

A practical starting rule targeting 50% static sag is    with damping ratio   5. Immediately after updating both wheels on an axle, apply an Anti-Roll Bar (ARB) force pair   , adding    to the left wheel's suspension force and    to the right wheel's (when grounded, re-clamped   ) to curb body roll without harshness over flat bumps5.
Two continuous scalars bridge realistic chassis dynamics and forgiving casual stability. First, borrowing from Unreal Chaos Vehicles1, wheelLoadRatio (   from 0 to 1) blends static equilibrium corner load with live dynamic suspension load before feeding the tire model:
  

At   , braking shifts grip forward and acceleration shifts grip rearward for authentic trail-braking and lift-off oversteer; dialing    down to 0.30–0.40 smooths bump-induced grip spikes and cures accidental lift-off spins1. Second, forceAppHeightBlend (0 to 1) interpolates the vertical application height of tangential tire forces from the road contact patch (0.0, full physical roll torque) up to the chassis center of mass (1.0, zero roll torque, matching Rocket League and Jolt's mEnableSuspensionForcePoint2).
In an analytical 0.5 m single-corner drop-test verification (1,450 kg reference chassis, 362.5 kg per corner), both our Simcade suspension (k = 32,000 N/m, bump damper 2,400 N·s/m, rebound damper 3,600 N·s/m, natural frequency 1.50 Hz, 39.7% static sag) and Casual Arcade suspension (k = 28,000 N/m, bump 4,200 N·s/m, rebound 4,800 N·s/m, natural frequency 1.40 Hz, 36.3% static sag) remained completely stable from 120 Hz down to 30 Hz, settling in 0.93–1.48 s with dimensionless stiffness   9. At 60 Hz, rebound damping ratios stay tight (   Simcade,    Casual Arcade), though rising to    at 30 Hz confirms why 50–60 Hz should be the floor for coupled four-wheel rigs with stiff anti-roll bars9.
Parametric Tire Model, Combined Slip, and Standstill Regularization
Using the Simplified 4-Parameter Pacejka Magic Formula evaluated symmetrically on slip magnitude (slip angle    in radians, slip ratio    dimensionless) lets one equation span sports-car breakaway through flat arcade traction7:
  

Under our verified Simcade preset, longitudinal parameters (B = 12.0, C = 1.65, D = 1.15, E = 0.30) peak at    at slip ratio 0.131 and drop to 0.772 (67.1% of peak) when locked—rewarding threshold braking and ABS9. Lateral parameters (B = 11.0, C = 1.50,   ,   , E = 0.10) peak at 9.4°, taper smoothly to 1.005 at 30°, and retain 0.887 (77.1% of peak) at 90°, with the slight rear grip bias preserving natural understeer stability9. Shifting only to Casual Arcade lateral parameters (B = 14.0, C = 1.15,   ,   , E = -1.0) produces immediate cornering bite (1.646 by 10°, peaking at 1.650 at 12.4°) followed by an almost flat plateau retaining 1.614 (97.8% of peak) all the way to 90°, eliminating snap-oversteer9.
To couple longitudinal and lateral grip realistically—so spinning or locked rear wheels lose sideways hold during drifts and burnouts—normalize both slips against their peak coordinates (  ,   , clamping    at 1.5 rad to keep    finite) and project the friction circle along the slip vector8:
  

  

To prevent standstill vibration and slope creep at 50–60 Hz, integrate longitudinal slip    via an implicit Euler Bernard–Clover relaxation update (  ), blend in low-speed sidewall damping below 1.5 m/s (capped at    to prevent discrete overshoot), and apply brake torque last using moveTowards(omega, 0, T_brake * dt / I)5:
  

  

In our 60 Hz verification test braking from 5 m/s to rest on a steep 15° downhill slope, naive clamped slip-ratio division failed and accelerated downhill to +7.96 m/s (tail SD 0.149 m/s), whereas the implicit relaxation plus low-speed damping model held a rock-solid zero-velocity stop (final speed 0.00000 m/s, SD 0.00000 m/s)9. Apply the same implicit relaxation laterally (   realistic, or as short as 0.007 m for ultra-crisp arcade steering8) so parked cars stay planted on banked roads.
Swappable Drivetrain, Differentials, and Aerodynamics
Both drivetrain modes expose one method returning axle drive torque, reflected driveline inertia, and normalized RPM. In Mode A (Six-Speed Combustion + LSD), interpolate engine torque    from a 250-RPM table, compute engine braking drag   , and evaluate    (guarding against drag reversing stopped wheels when avgSpin * sign(gearRatio) < 0)84. Multiply by total gear ratio    and efficiency   , reflecting driveline inertia at the wheel proportional to    (making first gear feel roughly 20× heavier to free-spin than a bare wheel5). Prevent stalling without stiff clutch springs via an idle floor   , and auto-shift only while driven wheels are grounded5. Split axle torque using one limitedSlip scalar (0.0 for an open daily-driver differential, 0.5 for a sport LSD that keeps both rear wheels driving through drifts, up to 1.0 approximating a locked axle8).
In Mode B (Five-Parameter Electric / Direct Drive)—ideal for casual games, off-road utilities, or quick prototyping—remove clutch, shift hysteresis, and reverse gear selection entirely using five parameters (maxTorque, maxPower, gearRatio, maxRpm, inertia)6:
  

Negative throttle drives directly in reverse, base speed    produces natural launch punch tapering into constant-power acceleration, and an optional lift-off regenerative drag torque controls coasting deceleration6.
Finally, apply reverse-safe aerodynamic drag and downforce at world CoM, plus standstill-regularized rolling resistance (   car tires, 0.007 truck tires) directly along each grounded wheel's forward axis8:
  

Adapting From Realistic to Casual: Assist Stack and Preset Spectrum
Why Coordinated Assists Beat Single-Layer Hacks
Simulating a full-throttle rear-wheel-drive corner at 90 km/h under a 1-second binary touch-button tap (modeling mobile Auto-Accelerate) uncovers a critical trap in vehicle assist design9. With zero assists, snapping front wheels to 32° while rear drive torque saturates the rear friction circle produces an immediate spinout (60.3° peak sideslip, 52.7°/s yaw rate, exiting at 28.6 km/h)9. Surprisingly, adding speed-sensitive front steering limits alone makes the spinout dramatically worse (87.1° peak sideslip, 68.1°/s yaw rate, spinning down to 3.6 km/h): holding the front tires right at their ~9.4° peak slip angle maximizes front turn-in torque precisely while excessive RWD wheelspin wipes out rear lateral grip via combined slip9. Coordinating five lightweight, physically grounded assist layers eliminates the spinout completely (2.1° peak sideslip, 10.9°/s yaw rate, clean 145.9 km/h corner exit)9:
1. Asymmetric Binary-to-Analog Input Smoothing: Dampens turn-in speed at highway velocities while accelerating return-to-center and opposite-lock counter-steering100.
2. Physics-Derived Grip Curvature Limit With Rear-Slip Reach Backoff: Caps normalized steering to   —where   —and scales allowed reach down from 0.95 to 0.55 whenever rear slip climbs from 0.5 to 1.1 of   8. For tall vehicles, enforce an additional static rollover clamp    that stays active even during slides8.
3. Active Counter-Steer Blend (counterSteerAssist from 0 to 1): Gently blends front wheel steering into vehicle sideslip    and yaw rate    via   , giving thumbstick and touchscreen drivers who lack steering-wheel self-aligning torque an intuitive catch-and-hold feel9.
4. Friction-Circle Traction Control (TCS): Reserves rear lateral grip during cornering by trimming drive force to   9.
5. Bicycle-Model Yaw Stability Control (ESC) & ABS: Applies proportional yaw-damping torque (or asymmetric wheel braking102) against target yaw rate error   , while ABS caps individual wheel brake torque to peak tire traction   8.
  

Speed-Curvature Limiting and Full-Vehicle Preset Benchmarks
Replacing hand-authored steering-angle-vs-speed splines with the physical curvature limit    automatically adapts whenever a designer changes a car's tire grip, wheelbase, or road surface8. Across 10 to 200 km/h, this single inverse-square law collapses maximum front lock by roughly 98%—from 32.00° down to 0.50° on our Simcade chassis (R_min = 4.24 m, holding ~1.03 G steady lateral acceleration from 50 to 200 km/h) and from 35.00° down to 0.69° on our Casual Arcade chassis (R_min = 3.78 m, holding ~1.44 G)9. To stop slow-feeling turn-in at high speed due to chassis yaw inertia, optionally add PrototypeEverything's steering lead term    above 3 m/s (clamped between 0 and raw driver steer)8.
Running both verified presets through our 60 Hz full-vehicle longitudinal benchmark confirms identical 218.7 km/h top speeds and comparable 0–100 km/h launches (5.23 s Simcade six-speed RWD vs. 5.35 s Casual Arcade direct-drive AWD), while Casual Arcade cuts 100–0 km/h stopping distance by 26.6% (24.3 m at 1.64 G vs. 33.1 m at 1.20 G) so non-racing players can brake late cleanly in tight urban maps9.
  

Master Adaptation Matrix: Three Presets on One Chassis
The matrix below maps ten core tuning dimensions across three target genres on the exact same 1,450 kg reference chassis (wheelbase 2.65 m, track width 1.55 m, wheel radius 0.34 m)1.


Tuning Knob / Subsystem
	Preset 1: Realistic Simcade (Driving-Centric)
	Preset 2: Open-World Action Hybrid (GTA V Style)
	Preset 3: Casual / Mobile Secondary-Mechanic
	Drivetrain Mode
	6-Speed ICE (340 N·m peak, 6 gears + 3.73 final, RWD)9
	6-Speed ICE or 5-Param Direct Drive (AWD 30/70 split)25
	5-Param Direct Drive AWD (320 N·m, 185 kW, fixed ratio 8.5)6
	Differential (limitedSlip)
	0.5 (Sport LSD rear)8
	0.5–0.7 (Predictable power slides)8
	0.8–1.0 (Prevents inside-wheel spinout)8
	CoM Height & Force App Blend
	Physical 0.50 m; force near contact patch (0.15)9
	Lowered 0.35 m; midpoint height (0.50)26
	Low 0.25 m; near CM height (0.85–1.0)2
	Suspension (k, ζ_bump/ζ_reb, ARB)
	32,000 N/m, ζ = 0.35 / 0.53, ARB 18,000 N/m9
	30,000 N/m, ζ = 0.50 / 0.65, ARB 26,000 N/m
	28,000 N/m, ζ = 0.66 / 0.75, ARB 35,000 N/m9
	Weight Transfer (wheelLoadRatio)
	1.00 (Full dynamic load sensitivity)1
	0.65 (Tames lift-off and curb snaps)1
	0.35 (Repeatable grip across bumps)1
	Lateral Pacejka (B, C, D_f / D_r, E)
	11.0, 1.50, 1.15 / 1.18, +0.10 (77% post-peak)9
	12.5, 1.32, 1.38 / 1.42, -0.45 (~88% post-peak)
	14.0, 1.15, 1.65 / 1.72, -1.00 (98% plateau)9
	Speed-Curvature & Slip Assist
	0.0 on wheel; 0.4 mild on gamepad9
	0.7 with rear-slip reach backoff8
	1.0 + binary smoothing + rollover clamp8
	Counter-Steer, TCS, ABS, ESC
	Optional toggles (default 0.0–0.3; ESC gain 400 N·m·s/rad)104
	CS 0.5, TCS 0.6, ABS On, ESC gain 1,400 N·m·s/rad
	CS 0.75–1.0, TCS 1.0, ABS On, ESC gain 2,800 N·m·s/rad9
	Airborne & Rollover Safeguards
	Off (maxPitchRollDeg = 180°)40
	Soft airborne leveling + unstuck rocking21
	45° pitch/roll cone + auto-righting + landing snap21
	Drift Paradigm
	Pure emergent weight transfer and throttle oversteer98
	Emergent + driftIntent/driftControl assist (30°–40° hold)8
	Optional isolated Kart-Drift state machine or handbrake slide1
	Making Drifting Fun Without Breaking Realism
Two cleanly separated approaches prevent drifting from corrupting normal driving feel. For Simcade and Open-World Hybrid presets, use emergent drifting assisted by continuous driver-intent tracking (modeled on PrototypeEverything's architecture8) rather than a locked rail state. Track two smooth floats: driftIntent rises at 3.3/s while holding handbrake or burnout and persists as long as rear-axle slide angle exceeds   , while driftControl rises when the player actively counter-steers into the slide with throttle    and decays sharply at 4.0/s the instant the player lifts throttle or brakes8. While driftControl > 0, the assist trims excess rear drive torque past 45°–50° to stop spinouts, restores partial lateral grip to spinning rear wheels, and narrows the counter-steer window so drifts settle comfortably in the mid-30° range (around a 40° hold target); lifting off instantly unlocks full recovery counter-steering8.
Alternatively, if a casual game explicitly calls for Mario Kart-style speed-preserving corner drifts and mini-turbo boosts, swap Layer 4's lateral Pacejka output while drifting for a mutually exclusive four-phase state machine (Hop    Short Slip    Drift    Post-Drift Correction) driven by two stick-to-drift curves (sideways travel scale and yaw velocity)1. Keeping the two lateral solvers mutually exclusive eliminates the conflicting force fights seen when arcade yaw torques are overlaid onto active tire physics1.
Mobile Controls, Input Conditioning, and Game Feel
Smartphones remove three critical feedback channels that console and PC driving games rely on: zero steering force feedback (no self-aligning torque warning of understeer or oversteer), glass pedals (no tactile throttle or brake resistance), and a moving visual reference during tilt play (tilting the screen rotates the road horizon with the player's hands)98. Delivering responsive, fun mobile driving requires combining selectable ergonomic layouts, device-specific input conditioning, and synchronized audiovisual-haptic cues.
  

Selectable Mobile Control Templates
Leading mobile games (GRID Autosport, Real Racing 3, Asphalt 9, PUBG Mobile) avoid forcing a single touch layout, instead routing selectable presets through one normalized input abstraction106.


Mobile Control Scheme
	Best Fit Genre & Context
	Ergonomic Strengths
	Observed Failure Modes
	Mandatory Engineering Mitigations
	Split Touch Buttons (L/R + Pedals)
	Casual arcade, public transit play, Asphalt / PUBG action106
	Zero thumb-drift ambiguity; crisp binary reversals; playable in any posture106
	Binary full-lock snaps; finger fatigue from constant tapping; thumb occlusion16
	Asymmetric temporal smoothing (inRate > outRate), curvature limiting, translucent hitboxes (70–80% opacity)100
	Virtual Thumbstick (Single or Split)
	Open-world / action games where driving is secondary (PUBG, Fortnite, GTA mobile)109
	Top usability preference across skill tiers; analog precision; matches on-foot movement16
	Single-stick combined throttle/steer hampers braking while turning; novices struggle coordinating stick + gas16
	Center dynamically on initial touch116; offer both Single-Stick (casual/novice) and Split Stick + Pedals/Slider (experienced)16
	On-Screen Virtual Steering Wheel
	Enthusiast mobile simcade (GRID Autosport Wheel Touch, CarX Street, Real Racing 3)110
	Position-mapped analog steering with visual lock cue16
	Thumb blocks bottom-left view; players over-rotate watching wheel spin16
	Spawn wheel dynamically under left thumb110; pair with a vertical analog Throttle Slider on right edge110
	Gyroscope / Tilt Steering
	Dedicated 3D third-person racers (Real Racing 3, GRID default, Asphalt pro)106
	Highest 3D racing immersion (d = 1.03); smooth steady hold through long corners; frees thumbs for pedals/drift15
	Awkward in public or lying down; moving horizon; accelerometer jitter; device vibration corrupts accelerometer sensors101
	Calibrate neutral posture118; use position-control mapping14; 3°–5° deadzone; 30°–45° full lock118; auto-disable haptics on accelerometer-only devices108; pause when laid flat118
	Auto-Accelerate + Optional Smart Assist
	One-hand mobile, novice onboarding (Mario Kart Tour, GRID Rookie, Asphalt TouchDrive)110
	Removes multi-input coordination barrier immediately16
	Limits expert corner-exit throttle control16
	Expose Auto-Accelerate as an independent toggle across layouts; pause auto-gas while braking; keep smart-steering assists optional so manual lines stay faster110
	Device-Adaptive Input Conditioning Pipeline (Layer 1)
Every input device—touchscreen buttons, virtual thumbsticks, tilt sensors, keyboards, gamepads, and 900° steering wheels—writes into one normalized VehicleInput struct (steer in -1 to 1, throttle, brake, handbrake in 0 to 1, plus InputSource)124. Layer 1 conditions raw input according to source type before Layer 2 ever sees it.
For analog inputs (thumbsticks, virtual wheels, tilt, gamepads, wheels), remove center noise with deadzone   , re-normalize the active range to 0–1, and shape fine center precision with power-law gamma   125:
  

Recommended starting values are zero deadzone and linear gamma (  , smoothing 0) for physical steering wheels126; 3–5% deadzone and    for gamepads and virtual thumbsticks125; and 3°–5° deadzone (8–12% of a 35°–45° full-lock angle) with    for tilt steering118.
For binary inputs (touch arrow buttons and keyboard A/D), never pass step functions directly to the rack. Advance filtered steering steerFilt toward raw input via moveTowards(steerFilt, u, rate * dt) using asymmetric, context-aware rates adapted from BeamNG's production steering script (input.lua, whose baseline keyboard rates kbdOutRate = 1.6 and kbdInRate = 2.2 scale with lock ratio up to 2.68 and 3.68100):
   1. Turn-In Away From Center: Use outRate around 1.8–2.0/s (for brisk mobile responsiveness9), scaled down with speed (1.0 at 10 m/s tapering to 0.50 at 35 m/s) and lateral-G understeer reduction 1 - 0.7 * clamp(|a_lat|/g, 0, 1) so holding a touch button never scrubs front grip into immediate understeer100.
   2. Release Return-to-Center: Use faster inRate around 2.2–3.2/s multiplied by a low-speed fade clamp((speed - 0.1) / 0.9, 0, 1) so parked wheels hold their lock rather than snapping straight at standstill9.
   3. Opposite-Button Reversal & Oversteer Counter-Steer Boost: Multiply inRate by 1.5× when pressing the opposite direction to re-center, and by 1.8× when input opposes current lateral acceleration or yaw rate—giving binary players fast counter-steer reflexes100.
For non-driving-centric 3D action games wanting optional camera-directed steering (similar to Halo's Warthog), compute wrapped heading error    and map    directly into the conditioned steer axis, while keeping classic left/right steering selectable in settings31.
The Game Feel Stack: Camera, Audio, Haptics, and Visual Juice
Sensory presentation is what translates physical weight and tire limits through a flat glass screen101. On the camera layer, avoid rigid chassis parenting—every road bump jars the horizon and corners feel wooden131. Implement a spring-mass-damper or SmoothDamp chase camera pointing along a velocity-blended forward vector so the camera lags subtly and reveals the car's flanks during drifts133. Add longitudinal pull-back under acceleration and subtle close-in under braking136, speed-scaled FOV widening in casual/hybrid presets (keeping 1:1 geometric FOV available for sim-focused modes where accurate braking-marker perception is essential135), damped vertical follow with landing shake139, and slowed pitch/roll tracking right after takeoff and touchdown so jumps stay comfortable131.
On the audio layer, drive synthesis from two physics telemetry channels: RPM and Throttle (Load)140. On mobile CPU budgets, multi-RPM loopsets (1–2 s steady loops spaced every 500 RPM with 250 RPM crossfades plus a 3–5 s idle loop) outperform granular synthesis in CPU efficiency despite requiring more prepared audio files140. Keep every RPM loop active from scene load and modulate normalized volumes (contrib / sumContrib) to eliminate streaming hitches141. Simulate on-load versus off-load engine character without doubling audio memory by playing Exhaust, Engine, and Intake layers on-throttle, while muting Intake, trimming volume, and applying real-time EQ attenuation around 2 kHz and 10 kHz off-throttle140. Pair engine audio with per-wheel tire skid volume and pitch driven continuously from contact-patch slip magnitude so players hear tires approaching breakaway102.
On the haptics layer, tactile feedback acts as a mobile stand-in for steering force feedback; a software-vendor UX review cites studies claiming up to 20% higher task accuracy and lower perceived latency from haptics, though no independent mobile-driving-specific benchmark was found in the literature reviewed129. Drive iOS Core Haptics and Android VibrationEffect (API 26+) using two distinct primitives: sharp transient taps synchronized with audio on gear shifts, curb strikes, landings, and impacts, and subtle continuous modulated rumble scaled to tire slip past    and off-road surface roughness130. Account for documented Android platform quirks: avoid repeating waveform loops (some vendor stacks, such as Samsung Galaxy A54, truncate looping waveforms—use a non-repeating 30-second segment canceled on stop), coalesce continuous amplitude updates to roughly 150 ms intervals to prevent stuttering, express sharpness on Android via transient pulse duration (40 ms sharp vs. 160 ms dull) rather than amplitude scaling, always honor OS accessibility settings, and disable vibration automatically when falling back to accelerometer-only tilt controls108.
Finally, on the visual layer, rate-limit visual wheel mesh steering to 200°/s, compute displayed wheel rotation from shownOmega = (v_x + slipRatio * |v_x|) / r to prevent single-step torque flicker5, and drive procedural pitch and roll on the detached visual car body from smoothed accelerations so low-CoM casual cars still dive under braking and lean playfully into turns2.
Mobile Performance Budget and POC Agent Handoff Specification
Mobile CPU Budget, Timestep Strategy, and Collision Queries
On mid-range smartphones targeting 60 FPS (16.6 ms total frame budget), sustained 100% GPU/CPU load triggers thermal throttling within 5–10 minutes (per mobile studio engineering benchmarks from Innovecs Games and Game-Ace)10. Innovecs Games' starting 60 FPS mid-range mobile budget allocates roughly 3.0 ms to gameplay scripts and AI while holding ~6.1 ms strictly as thermal headroom—and notes that Unity mobile builds default silently to 30 FPS unless Application.targetFrameRate = 60 is explicitly set10.
Run the vehicle physics tick at a fixed 60 Hz (16.67 ms) or 50 Hz (20.0 ms) with rigidbody transform interpolation enabled so visuals stay silky on 90–120 Hz mobile screens1. Do not crank the entire world physics engine up to 120–360 Hz on mobile; if realistic presets need tighter tire or differential convergence, run 2–4 local internal substeps exclusively inside the player vehicle's drivetrain/tire update (Vehicle Physics Pro profiler observations report negligible CPU overhead up to 8 local substeps, recommending at least powered_wheels / 2 substeps72). Always cap catch-up loops on frame hitches (Maximum Allowed Timestep of 0.1–0.33 s) and express all velocity decay per second via exact exponential decay    rather than frame-rate-dependent multipliers like v *= 0.95.
No standardized cross-engine mobile benchmark quantifying single-raycast versus spherecast versus multi-ray wheel costs was found in published literature; engine guides and mobile optimization write-ups concur that single raycasts scale best on mobile and batch cleanly onto background worker threads5. Default to 1 downward raycast per wheel (4 rays per car) for casual titles and NPC traffic, upgrading only the player car to 1 spherecast per wheel (or a 3-ray fan148) when tracks contain sharp, unbeveled curbs—while beveling curb collision meshes in level geometry wherever possible1.
Exact 11-Step Fixed Physics Execution Order
The downstream POC agent must execute VehicleController.StepPhysics(dt) in the following strict order every fixed physics tick. Order prevents one-frame lag artifacts and oscillatory feedback: steering must precede raycasts so road-plane bases align with current wheel angles, wheel contacts must precede drivetrain updates so airborne wheels never trigger gear shifts, tire forces must evaluate start-of-step slip before advancing wheel spin, and braking must run last to lock wheels cleanly at zero5.
   1. Snapshot RigidBody State: Read body position, rotation, linear velocity, angular velocity, and world CoM once at tick start ("One Step, One Snapshot")5.
   2. Condition Player Inputs (Layer 1): Apply analog deadzone/gamma or asymmetric speed- and lateral-G-scaled binary smoothing; resolve Auto-Accelerate or optional Camera-Directed Steering31.
   3. Compute Chassis Local Kinematics & Slide State: Transform velocity into local chassis frame relative to previous tick's average ground velocity; compute vehicle sideslip   , rear-axle slide angle   , and slide rate   8.
   4. Update Driver Assist States (Layer 2a): Advance driftIntent and driftControl, compute physics-derived speed-curvature steering limit    with rear-slip reach backoff, apply tall-vehicle rollover clamp, and compute active counter-steer blend8.
   5. Apply Ackermann Steering Geometry: Convert conditioned steer command to inner and outer wheel angles (  ) via the singularity-free Ackermann formula75; apply per-wheel peak-slip window clamping when steering assist is enabled8.
   6. Execute Wheel Ground Probes: Cast 4 downward rays (or spherecasts) from upper strut mounts inside the chassis collider along    of length   ; build ground-plane axes    and moving-ground relative velocities   5.
   7. Compute Suspension Springs, Dampers & Anti-Roll Bars: Evaluate asymmetric bump/rebound spring-damper forces (using tilted-ground velocity blending, progressive bump stops, and    clamping), apply left/right axle ARB force pairs, and compute wheelLoadRatio-blended tire normal loads   1.
   8. Evaluate Swappable Drivetrain (Layer 3): Compute driveTorque, engine/regen braking, and reflected drivelineInertia using either Mode A (6-speed combustion + pseudo-clutch floor + grounded auto-shift) or Mode B (5-parameter Direct Drive) from the previous tick's driven wheel speeds6.
   9. Distribute Axle Torque, TCS & Differential: Split drive torque across front/rear axles (driveBiasFront); apply friction-circle Traction Control (TCS) and Limited-Slip Differential (limitedSlip) bias across left and right wheels8.
   10. Solve Per-Wheel ABS, Regularized Tire Forces & Impulses: Cap brake torque via ABS; update implicit Bernard–Clover relaxation slip (  ); evaluate simplified Pacejka + normalized friction circle + low-speed sidewall damping + rolling resistance; apply upward normal force at contact point and tangential tire forces at forceAppHeightBlend (plus equal-and-opposite force onto dynamic ground bodies); update wheel spin    and apply braking last via moveTowards(omega, 0, ...)5.
   11. Apply Aerodynamics, ESC & Safeguards: Apply reverse-safe aerodynamic drag and downforce at world CoM83; apply bicycle-model yaw-rate ESC damping torque9; enforce airborne leveling and maxPitchRollDeg cone clamp if enabled21; write telemetry snapshot for visual meshes, camera, audio, and haptics5.
Unified POC Configuration Schema (VehicleConfig)
Provide this engine-agnostic JSON schema directly to the POC coding agent. Switching from the Simcade Realistic baseline below to our verified Casual Mobile Arcade preset requires overriding only the subset of fields listed immediately underneath—no code changes.






JSON
{
 "presetName": "Simcade_Realistic",
 "chassis": {
   "massKg": 1450.0,
   "yawInertiaKgM2": 2350.0,
   "wheelbaseM": 2.65,
   "frontAxleOffsetM": 1.25,
   "rearAxleOffsetM": -1.40,
   "trackWidthM": 1.55,
   "comHeightM": 0.50,
   "forceAppHeightBlend": 0.15,
   "aeroCdA": 0.667,
   "aeroClA": 0.323,
   "maxPitchRollDeg": 180.0
 },
 "suspension": {
   "probeType": "raycast",
   "wheelRadiusM": 0.34,
   "wheelMassKg": 20.0,
   "travelM": 0.28,
   "springRateNPerM": 32000.0,
   "bumpDamperNsPerM": 2400.0,
   "reboundDamperNsPerM": 3600.0,
   "antiRollBarNPerM": 18000.0,
   "wheelLoadRatio": 1.00
 },
 "tires": {
   "longPacejka": { "B": 12.0, "C": 1.65, "D": 1.15, "E": 0.30, "peakSlip": 0.131 },
   "latPacejkaFront": { "B": 11.0, "C": 1.50, "D": 1.15, "E": 0.10, "peakAngleDeg": 9.4 },
   "latPacejkaRear": { "B": 11.0, "C": 1.50, "D": 1.18, "E": 0.10, "peakAngleDeg": 9.4 },
   "relaxationLongM": 0.15,
   "relaxationLatM": 0.12,
   "rollingResistanceCrr": 0.012
 },
 "drivetrain": {
   "mode": "CombustionMultiGear",
   "driveBiasFront": 0.0,
   "limitedSlipRear": 0.5,
   "limitedSlipFront": 0.0,
   "combustion": {
     "peakTorqueNm": 340.0,
     "gears": [3.50, 2.25, 1.58, 1.20, 0.96, 0.78],
     "finalDrive": 3.73,
     "efficiency": 0.88,
     "idleRpm": 900.0,
     "redlineRpm": 7200.0,
     "shiftUpRpm": 6800.0,
     "shiftDownRpm": 3200.0
   },
   "directDrive": {
     "maxTorqueNm": 320.0,
     "maxPowerW": 185000.0,
     "fixedGearRatio": 8.5,
     "maxRpm": 14500.0,
     "regenBrakeTorqueNm": 60.0
   },
   "maxBrakeTorqueTotalNm": 8500.0,
   "brakeBiasFront": 0.65,
   "handbrakeTorqueRearNm": 4000.0
 },
 "steeringAndAssists": {
   "maxSteerAngleDeg": 32.0,
   "speedCurvatureLimitStrength": 0.40,
   "counterSteerAssist": 0.25,
   "tractionControlStrength": 0.30,
   "absEnabled": true,
   "escYawDampingGain": 400.0,
   "escStabilityFactorKstab": 0.0015,
   "driftAssistMode": "EmergentIntentControl",
   "airborneStabilization": 0.0
 },
 "mobileInput": {
   "defaultScheme": "SplitJoystick",
   "autoAccelerate": false,
   "binarySteerOutRate": 1.8,
   "binarySteerInRate": 3.2,
   "analogDeadzone": 0.04,
   "analogGamma": 2.0,
   "tiltFullLockDeg": 40.0,
   "tiltDeadzoneDeg": 4.0
 }
}

To instantiate the verified Casual Mobile Arcade preset from the schema above, override: chassis (yawInertiaKgM2: 2100.0, frontAxleOffsetM: 1.325, rearAxleOffsetM: -1.325, comHeightM: 0.25, forceAppHeightBlend: 0.90, aeroCdA: 0.753, aeroClA: 0.968, maxPitchRollDeg: 45.0), suspension (travelM: 0.35, springRateNPerM: 28000.0, bumpDamperNsPerM: 4200.0, reboundDamperNsPerM: 4800.0, antiRollBarNPerM: 35000.0, wheelLoadRatio: 0.35), tires (longPacejka.D: 1.55, latPacejkaFront: {B: 14.0, C: 1.15, D: 1.65, E: -1.0, peakAngleDeg: 12.4}, latPacejkaRear.D: 1.72, rollingResistanceCrr: 0.015), drivetrain (mode: "DirectDrive", driveBiasFront: 0.50, limitedSlipRear: 0.9, limitedSlipFront: 0.9, maxBrakeTorqueTotalNm: 12000.0), steeringAndAssists (maxSteerAngleDeg: 35.0, speedCurvatureLimitStrength: 1.0, counterSteerAssist: 0.75, tractionControlStrength: 1.0, escYawDampingGain: 2800.0, airborneStabilization: 1.0), and mobileInput (defaultScheme: "SingleJoystick", autoAccelerate: true)9.
POC Automated Acceptance Test Suite
Because vehicle feel is easy to misdiagnose visually, wire these eight deterministic headless unit tests directly against VehicleController.StepPhysics(dt)5.


Test Case
	Test Setup & Input
	Simcade Pass Criteria
	Casual Arcade Pass Criteria
	Bugs Caught
	1. Drop-Test Stability
	Spawn 0.5 m above flat tarmac; run at both 60 Hz and 30 Hz9
	No NaN/explosion; settles to ~40% sag within 1.6 s9
	No NaN/explosion; settles to ~36% sag within 1.1 s9
	Ray origin outside collider; overdamped/stiff spring explosion87
	2. 15° Slope Standstill Hold
	Brake from 5 m/s to 0 facing downhill on 15° incline; hold 5 s9
	Final speed < 0.01 m/s; velocity SD < 0.005 m/s9
	Final speed < 0.01 m/s; zero downhill creep9
	Standstill slip-ratio division-by-zero; brake reversal jitter5
	3. 0–100 km/h & Top Speed
	Full throttle on flat tarmac for 30 s at 60 Hz9
	0–100 km/h in 5.0–5.5 s; top speed 215–222 km/h9
	0–100 km/h in 5.1–5.6 s; top speed 215–222 km/h9
	Bad gearing/torque scaling or missing aerodynamic drag9
	4. 100–0 km/h Braking
	Full brake from 100 km/h to 0 with ABS active9
	Stops in 31–35 m (~1.20 G); zero backward roll9
	Stops in 23–26 m (~1.64 G); zero backward roll9
	Brake torque applied before tire forces; wheel reversal5
	5. Ackermann Low-Speed Circle
	Full steer at 10 km/h for 360° circle9
	Turn radius 4.2–4.6 m (~8.5 m dia); inner 37.4°, outer 27.9°9
	Turn radius 3.8–4.2 m; smooth scrub-free turn9
	Inverted Ackermann signs; cotangent zero-division75
	6. Mobile Binary High-Speed Corner
	At 90 km/h under full throttle (Auto-Accel), hold binary Right 1.0 s, then release9
	Assists Off: controllable oversteer; Assists On: sideslip < 10°, no spinout9
	Peak sideslip < 5°; clean recovery to 0°; exit speed > 130 km/h9
	Steer-limit-only pitfall; uncoordinated TCS / CS / ESC9
	7. Ramp & Moving Platform
	Park on moving/rotating platform (5 m/s); drive up 20° ramp5
	Zero slip relative to platform; smooth ramp climb5
	Identical platform grip; airborne leveling engages off crest5
	World-space tire velocity bug; world-down raycast bug5
	8. Frame-Rate Independence
	Replay identical steering/throttle trace at 30, 60, and 120 FPS render rates5
	Final (x, z) divergence < 0.5 m across render rates5
	Final (x, z) divergence < 0.5 m across render rates5
	Physics inside render Update() or per-frame damping trap5
	Recommended POC Build Sequence
Stage POC execution across four sequential milestones so each physical layer is verified before adding higher-level complexity:
      1. Milestone 1 — Chassis & Standstill Core: Implement the single RigidBody, four inside-hull raycasts, asymmetric spring-damper plus ARB, simplified Pacejka with implicit Bernard–Clover low-speed hold, and five-parameter Direct Drive. Pass Tests 1, 2, 5, and 7 before moving on.
      2. Milestone 2 — Full Drivetrain & Combined Slip: Add the normalized combined-slip friction circle, Mode A six-speed combustion engine with pseudo-clutch idle floor and LSD, and wheelLoadRatio. Verify Simcade and Casual Arcade benchmarks against Tests 3 and 4.
      3. Milestone 3 — Mobile Input & Coordinated Assist Stack: Implement Layer 1 (deadzone/gamma, asymmetric BeamNG-style binary smoothing, calibrated position-mapped tilt, Auto-Accelerate, and selectable Split/Single-Stick touch UI) alongside Layer 2 (curvature limit, rear-slip reach backoff, friction-circle TCS, counter-steer blend, ABS, ESC, and driftIntent/driftControl). Pass Tests 6 and 8 on a real mobile device at a locked 60 FPS.
      4. Milestone 4 — Game Feel Polish: Attach the velocity-aligned spring-damper chase camera, procedural visual pitch/roll on the detached car mesh, multi-RPM load-modulated engine audio plus per-wheel skid audio, and Core Haptics / Android VibrationEffect tactile cues.
Works cited
      1. Chaos Vehicle drift vs arcade kart physics: a UE5 guide, https://kartphysics.com/blog/arcade-kart-physics-vs-chaos-vehicles
      2. The physics and networking of Rocket League - GDC Vault, https://media.gdcvault.com/gdc2018/presentations/Cone_Jared_It_Is_Rocket.pdf
      3. Vehicles — physx 5.1.0 documentation, https://nvidia-omniverse.github.io/PhysX/physx/5.1.0/docs/Vehicles.html
      4. https://vehiclephysics.com/advanced/block-reference/
      5. Raycast and wheel contact | Vehicle Fundamentals, https://vehicle-fundamentals.prototypeeverything.com/suspension/raycast/
      6. https://vehicle-fundamentals.prototypeeverything.com/drivetrain/electric-drive/
      7. https://www.edy.es/dev/docs/pacejka-94-parameters-explained-a-comprehensive-guide/
      8. https://vehicle-fundamentals.prototypeeverything.com/together/update-order/
      9. unknown_url
      10. Unity Game Optimization: Profiling, Rendering & Memory Tips, https://www.innovecsgames.com/blog/unity-game-optimization/
      11. Unreal Engine for mobile games: when it fits - Game-Ace, https://game-ace.com/blog/unreal-engine-for-mobile-games/
      12. Advanced slip ratio for ensuring numerical stability of low-speed, https://www.semanticscholar.org/paper/Advanced-slip-ratio-for-ensuring-numerical-of-Part-Jung-Kim/3a7c6b597d4c02e61b2f8ab5fb041a2e999dfbc8
      13. GDSim by Wolfe - itch.io, https://lupine-vidya.itch.io/gdsim
      14. https://www.yorku.ca/mack/gi2014.html
      15. The Influence of Controllers on Immersion in Mobile Games, https://www-users.york.ac.uk/~pc530/pubs/Li_CHI2014.pdf
      16. Mapping Controls on a 2D User Drawn Racetracks Driving Game, https://estudogeral.uc.pt/bitstream/10316/87771/1/Rocha%20et%20al.%20-%202019%20-%20Mapping%20Controls%20on%20a%202D%20User%20Drawn%20Racetracks%20Driving%20Game%20%E2%80%93%20An%20Usability%20Assessment.pdf
      17. Implementing Racing Games: An intro to different approaches and, https://www.gamedeveloper.com/design/implementing-racing-games-an-intro-to-different-approaches-and-their-game-design-trade-offs
      18. Quick Arcade-style Car :: Godot 3 Recipes - KidsCanCode, https://kidscancode.org/godot_recipes/3.x/3d/3d_sphere_car/index.html
      19. Arcade-style Car :: Godot 4 Recipes - KidsCanCode, https://kidscancode.org/godot_recipes/4.x/3d/3d_sphere_car/index.html
      20. Space Dust Racing (Unreal Engine 4) Arcade Vehicle Physics Tour, https://www.reddit.com/r/unrealengine/comments/2dbhct/space_dust_racing_unreal_engine_4_arcade_vehicle/
      21. Home - ArcadeVS - GitHub Pages, https://poyoworks.github.io/ArcadeVS_DemoProject/
      22. Making Custom Car Physics in Unity (for Very Very Valet) - YouTube, https://www.youtube.com/watch?v=CdPYlj5uZeI
      23. Making Custom Car Physics in Unity (for Very Very Valet), https://opentools.ai/youtube-summary/making-custom-car-physics-in-unity-for-very-very-valet
      24. benmcinnes/ArcadeVehiclePhysics: A framework for creating an, https://github.com/benmcinnes/ArcadeVehiclePhysics
      25. FiveM handling.meta Editor - XGamingServer, https://xgamingserver.com/tools/fivem/handling-meta
      26. FiveM Vehicle Handling: Complete Tuning & Configuration Guide, https://rarxnetwork.com/blog/fivem-vehicle-handling-guide
      27. PrestigeRoleplay/fivem-handling-presets - GitHub, https://github.com/PrestigeRoleplay/fivem-handling-presets
      28. Naughty Dog Will Share More About Uncharted 4's Technology at, https://www.dualshockers.com/uncharted-4-naughty-dog-technology-gdc-2017/
      29. Vehicle Physics and Tire Dynamics in Just Cause 4 - GDC Vault, https://media.gdcvault.com/gdc2019/presentations/Young_Hamish_Vehicle_Physics_And.pdf
      30. The Complete, Untold History of Halo - VICE, https://www.vice.com/en/article/the-complete-untold-history-of-halo-an-oral-history/
      31. How can I make Halo-like vehicle physics? - Godot Forum, https://forum.godotengine.org/t/how-can-i-make-halo-like-vehicle-physics/112349
      32. Patch 1.2 — list of changes - Home of the Cyberpunk 2077 universe, https://www.cyberpunk.net/en/news/37801/patch-1-2-list-of-changes
      33. Cyberpunk 2077: PS5 and Xbox Series X/S Versions Are Out Now, https://www.ign.com/articles/cyberpunk-2077-ps5-xbox-series-xs-next-gen-update-game-pass-release-date
      34. Please give us better driving now | Forums - CD PROJEKT RED, https://forums.cdprojektred.com/index.php?threads/please-give-us-better-driving-now.11133376/
      35. Driving Handling, or How to "get" it | Forums - CD PROJEKT RED, https://forums.cdprojektred.com/index.php?threads/driving-handling-or-how-to-get-it.11054621/
      36. Forza Horizon 6 on Wheel: Advanced Wheel Tuning, https://support.forza.net/hc/en-us/articles/51642814113427-Forza-Horizon-6-on-Wheel-Advanced-Wheel-Tuning
      37. Forza Motorsport is a 'huge generational leap' from previous games, https://www.reddit.com/r/XboxSeriesX/comments/nssfq7/forza_motorsport_is_a_huge_generational_leap_from/
      38. How Much Of Forza Motorsport Is Actually 'Built From The Ground Up?', https://www.jalopnik.com/how-much-of-forza-motorsport-is-actually-built-from-the-1850035229/
      39. https://jrouwe.github.io/JoltPhysics/class_wheel_settings_w_v.html
      40. Jolt Physics: VehicleConstraintSettings Class Reference, https://jrouwe.github.io/JoltPhysicsDocs/5.1.0/class_vehicle_constraint_settings.html
      41. Tires - Vehicle Physics Pro, https://vehiclephysics.com/blocks/tires/
      42. Telemetry Outputs Overview | DR Sim Manager, https://docs.departedreality.com/dr-sim-manager/development/telemetry-outputs-overview/
      43. Vehicle Physics and Data Configuration | PDF | Euclidean Vector, https://www.scribd.com/document/813097469/Physics-Modding
      44. Soft-body Simulation and Procedural Generation for ... - BeamNG.tech, https://beamng.tech/research/ICSE_SEIP%20-%20Alessio%20Gambi,%20BeamNG,%20Sebastiano%20Panichella%20%28Research%20paper%29.pdf
      45. Assetto Corsa Modding Manual 3.0 | PDF - Scribd, https://www.scribd.com/document/700457509/Assetto-Corsa-Modding-Manual-3-0-0-27revh
      46. Experimental - Jbeam Forge all in one car creation | BeamNG, https://www.beamng.com/threads/jbeam-forge-all-in-one-car-creation.111873/
      47. BeamNG.drive's 0.35 Vehicle Strength And JBeam Updates Bolster, https://www.overtake.gg/news/beamng-drives-0-35-vehicle-strength-and-jbeam-updates-bolster-playability.3075/
      48. A Low-cost Research Platform for High-speed Off-road ... - arXiv, https://arxiv.org/html/2311.11199v2
      49. 19 Best Car Crash and Vehicle Physics Games, From BeamNG, https://vgtimes.com/top-and-the-best/175104-games-like-beamng-drive.html
      50. I need help in C# for unity to have a car tilt, but not tip over. - Reddit, https://www.reddit.com/r/gamedev/comments/jzlkhz/i_need_help_in_c_for_unity_to_have_a_car_tilt_but/
      51. Vehicle Feel Masterclass: Balancing Arcade Accessibility with, https://www.gdcvault.com/play/1025295/Vehicle-Feel-Masterclass-Balancing-Arcade
      52. https://media.gdcvault.com/gdc2018/presentations/Harris_Matthew_VehicleFeelMasterclass.pdf
      53. ICYMI: Here's everything so far about the new Forza Motorsport game!, https://www.reddit.com/r/forza/comments/15qkrjx/icymi_heres_everything_so_far_about_the_new_forza/
      54. Can Forza Horizon 6 feel decent with a wheel, or is it still too arcade?, https://www.reddit.com/r/simracing/comments/1tf7c12/can_forza_horizon_6_feel_decent_with_a_wheel_or/
      55. My 5 cents for Simulation vs Normal steering : r/forza - Reddit, https://www.reddit.com/r/forza/comments/185y7ip/my_5_cents_for_simulation_vs_normal_steering/
      56. Discussion Thread: Handling and Physics : r/needforspeed - Reddit, https://www.reddit.com/r/needforspeed/comments/844zxw/discussion_thread_handling_and_physics/
      57. Need For Speed Hot Pursuit 2010 Ps3 - Elearning, https://elearning.asc.edu.ag/need-speed-hot-pursuit-2010-ps3
      58. The thing that grinds my gears with the NFS community [RANT], https://www.reddit.com/r/needforspeed/comments/cr8zob/the_thing_that_grinds_my_gears_with_the_nfs/
      59. Need for Speed Unbound Review: Reheated - GTPlanet, https://www.gtplanet.net/forum/threads/need-for-speed-unbound-review-reheated.414639/
      60. People think the driving is bad? Are we playing the same game?, https://www.reddit.com/r/cyberpunkgame/comments/1vg9dlq/people_think_the_driving_is_bad_are_we_playing/
      61. What are your initial thoughts on the Rev-8? : r/Starfield - Reddit, https://www.reddit.com/r/Starfield/comments/1exfr7d/what_are_your_initial_thoughts_on_the_rev8/
      62. I'm struggling to complete the maw mission in campaign evolved, https://www.reddit.com/r/halo/comments/1vdd1sl/im_struggling_to_complete_the_maw_mission_in/
      63. Scripting API: WheelCollider - Unity 6.6 User Manual, https://docs.unity3d.com/6000.4/Documentation/ScriptReference/WheelCollider.html
      64. Scripting API: WheelCollider.ConfigureVehicleSubsteps, https://docs.unity3d.com/2023.1/Documentation/ScriptReference/WheelCollider.ConfigureVehicleSubsteps.html
      65. https://docs.unity3d.com/6000.2/Documentation/Manual/wheel-colliders-friction.html
      66. Scripting API: WheelCollider - Unity 6.6 User Manual, https://docs.unity3d.com/2021.2/Documentation/ScriptReference/WheelCollider.html
      67. Unity's Wheel Collider vs Custom Car Physics : r/Unity3D - Reddit, https://www.reddit.com/r/Unity3D/comments/13nm5fa/unitys_wheel_collider_vs_custom_car_physics/
      68. Finally finished our Custom Wheel Collider. Here are a few things, https://www.reddit.com/r/Unity3D/comments/cqsqg6/finally_finished_our_custom_wheel_collider_here/
      69. Wheel Friction Curve Revealed - Documentation - Unity Discussions, https://discussions.unity.com/t/wheel-friction-curve-revealed/487227
      70. Mastering Vehicle Physics in Unreal Engine: A Deep Dive into, https://88cars3d.com/2025/12/04/mastering-vehicle-physics-in-unreal-engine-a-deep-dive-into-chaos-vehicles/
      71. Jolt Physics: VehicleCollisionTester Class Reference, https://jrouwe.github.io/JoltPhysicsDocs/5.0.0/class_vehicle_collision_tester.html
      72. Miscelaneous topics explained - Vehicle Physics Pro, https://vehiclephysics.com/advanced/misc-topics-explained/
      73. VehicleBase reference - Vehicle Physics Pro, https://vehiclephysics.com/advanced/vehiclebase-reference/
      74. Kinematic Bicycle Model — Algorithms for Automated Driving, https://thomasfermi.github.io/Algorithms-for-Automated-Driving/Control/BicycleModel.html
      75. Introduction to Ackermann Steering - RAW, https://raw.org/book/kinematics/ackerman-steering/
      76. A Closed-Form Adaptive Understeer Gradient Lateral Controller for, https://skoge.folk.ntnu.no/prost/proceedings/ifac2026_IFACWC26_preprints/files/3803.pdf
      77. Modelling, Positioning, and Deep Reinforcement Learning Path, https://arxiv.org/html/2401.05194v1
      78. Adaptive model predictive control for robust lateral motion tracking of, https://pmc.ncbi.nlm.nih.gov/articles/PMC12780120/
      79. Car Physics | PDF | Torque | Transmission (Mechanics) - Scribd, https://www.scribd.com/document/371065431/Car-Physics
      80. https://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
      81. GDSim v0.4a - Autocross and Custom Setups | GTPlanet, https://www.gtplanet.net/forum/threads/gdsim-v0-4a-autocross-and-custom-setups.396400/
      82. Vehicle physics pacejka lateral velocity | GameDev.net, https://gamedev.net/forums/topic/711781-vehicle-physics-pacejka-lateral-velocity/
      83. A Hybrid UKF with Explicit Drivetrain Modelingfor Low-Velocity State, https://arxiv.org/html/2611.08117v1
      84. https://lupine-vidya.itch.io/gdsim/devlog/677572/series-driving-simulator-workshop-mirror
      85. Discrete Tire Model Application for Vehicle Dynamics Performance, https://vtechworks.lib.vt.edu/bitstream/handle/10919/74394/Siramdasu_Y_D_2015.pdf?isAllowed=y&sequence=1
      86. Raycast suspension at high physics time step problem. - GameDev.net, https://gamedev.net/forums/topic/702824-raycast-suspension-at-high-physics-time-step-problem/
      87. https://www.gamedev.net/articles/programming/math-and-physics/towards-a-simpler-stiffer-and-more-stable-spring-r3227/
      88. Advanced lagged slip ratio for stable analysis of wheel dynamics at, https://www.semanticscholar.org/paper/Advanced-lagged-slip-ratio-for-stable-analysis-of-Kim-Jung/e56cc5928f2744f3a1a9a8ac66248fb5bbaf4642
      89. Tire Modeling for Low-Speed Dynamics | PDF | Damping - Scribd, https://www.scribd.com/document/821301847/Lagged-Slip-Ratio
      90. Dynamic Friction Models for Road/Tire Longitudinal Interaction, https://dcsl.gatech.edu/papers/vsd02.pdf
      91. Comparing Order of Control for Tilt and Touch Games - York University, https://www.yorku.ca/mack/ie2014.html
      92. Tilt-Controlled Mobile Games: Velocity-control vs. Position-control, https://www.yorku.ca/mack/ieeegem2014a.html
      93. Tilt-input - Mobile Games; Facial Tracking - York University, https://www.yorku.ca/mack/ieeegem2014b.html
      94. Arcade car physics | GameDev.net, https://gamedev.net/forums/topic/699625-arcade-car-physics/
      95. Raycast Car - psychicsoftware, https://www.psychicsoftware.com/2014/raycast-car/
      96. Custom wheel collider physics issue - Unity Discussions, https://discussions.unity.com/t/custom-wheel-collider-physics-issue/1680989
      97. I Spent 3 Years Making Car Physics. What Do I Even Do With It Now?, https://www.reddit.com/r/Unity3D/comments/1kaqw5u/i_spent_3_years_making_car_physics_what_do_i_even/
      98. Car Control in Sim Racing: Weight Transfer Guide | SRP®, https://simracing-pro.com/sim-racing-car-control-guide/
      99. Development of a car physics engine for games, https://nccastaff.bournemouth.ac.uk/jmacey/MastersProject/MSc12/Srisuchat/Thesis.pdf
      100. BeamNG Steering Assist (Updated with v0.34.1 or 24/12/16) · GitHub, https://gist.github.com/GettingWhiter/38d585e1517e38845053f199f47493be
      101. Racing Sims on Phone and Tablet: What Is Realistic, https://sim.racing/mobile-racing-simulator-ultimate-gaming-experience/
      102. Changelog - Vehicle Physics Pro, https://vehiclephysics.com/about/changelog/
      103. Vehicle Settings Optimization Guide | PDF | Manual Transmission, https://www.scribd.com/document/852891504/2-CoreModule
      104. Change the Way You Play Cyberpunk 2077 with Night City GT, https://www.xmodhub.com/en/game-mods/cyberpunk-2077-mods/night-city-gt
      105. how to save a slide in F125, https://www.f125game.com/driving-fundamentals/how-to-save-a-slide-in-f125/
      106. Manual or Tilt to Steer? : r/Asphalt9 - Reddit, https://www.reddit.com/r/Asphalt9/comments/1fqj7j4/manual_or_tilt_to_steer/
      107. RR3 Wiki:Tips and FAQ for Front-Runner - Fandom, https://rr3.fandom.com/wiki/RR3_Wiki:Tips_and_FAQ_for_Front-Runner
      108. GRID™ Autosport for mobile - FAQs (Frequently Asked Questions), https://www.feralinteractive.com/en/faqs/gridautosport/1.6/android/?access=tycfukaw3c
      109. Vehicle Driving Control Layout Settings | BGMI - YouTube, https://www.youtube.com/watch?v=i366j_NMX4I
      110. GRID™ Autosport for mobile - FAQs (Frequently Asked Questions), https://www.feralinteractive.com/en/faqs/gridautosport/latest/ios/
      111. CarX Street on PC with GameLoop: Controls, Settings, and Setup, https://gameloop.blog/news/carx-street-gameloop-pc/
      112. PUBG MOBILE FLASH Claw Guide Best 2-Finger and 3-Finger HUD, https://www.bluestacks.com/blog/game-guides/pubg-mobile-flash/pmf-best-claw-settings-en.html
      113. Grand Theft Auto San Andreas - Everything you need to know, https://www.androidauthority.com/grand-theft-auto-san-andreas-android-review-326766/
      114. I find driving vehicles difficult on mobile. Can we get some optional, https://www.reddit.com/r/FortniteMobile/comments/9zw9jl/i_find_driving_vehicles_difficult_on_mobile_can/
      115. Guide to controls optimization in PUBG Mobile - Google Play, https://play.google.com/store/apps/editorial?id=mc_editorial_evergreen_post_install_pubg_mobile_improve_your_controls_now_fcp
      116. PUBG Mobile Best Sprint Sensitivity Settings To Use - Gamers Decide, https://www.gamersdecide.com/articles/pubg-mobile-best-sprint-sensitivity-settings
      117. Real Racing 3 Review - IGN, https://www.ign.com/articles/2013/02/28/real-racing-3-review
      118. Gyro steering for racing games: setup and tuning - GamepadOS, https://www.gamepad.space/guides/gyro-steering-racing
      119. why does touchdrive even exist? what's the point of "playing ... - Reddit, https://www.reddit.com/r/Asphalt9/comments/kcunxz/why_does_touchdrive_even_exist_whats_the_point_of/
      120. Horrible controls : r/MarioKartTour - Reddit, https://www.reddit.com/r/MarioKartTour/comments/d90pc1/horrible_controls/
      121. Mario Kart 8 Deluxe Overview | PDF - Scribd, https://www.scribd.com/document/874362522/Mario-Kart-8-Deluxe-Super-Mario-Wiki-The-Mario-Encyclopedia
      122. Mario Kart 8 Gameplay Speedrun - discover.hastings.edu, https://discover.hastings.edu/content/files/EAt8907bil9O/Mario_Kart_8_Gameplay_Speedrun
      123. Mario Kart 8 (Video Game) - TV Tropes, https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/MarioKart8
      124. It seems a bit over complicated - why not just keep it simple? - Input, https://discussions.unity.com/t/it-seems-a-bit-over-complicated-why-not-just-keep-it-simple/631376
      125. Generic - Advanced Steering Setup (Controller) - Assetto Corsa, https://www.assettocorsa.net/forum/index.php?threads/advanced-steering-setup-controller.35589/
      126. F125 steering sensitivity and linearity explained, https://www.f125game.com/driving-fundamentals/f125-steering-sensitivity-and-linearity-explained/
      127. Racing Game Controller Setup: Calibrate, Map, and Drive Like a Pro, https://rushcontroller.com/blogs/gaming-performance-skills/racing-game-controller-setup-guide
      128. NWH Vehicle Physics 2 Documentation - Vehicle Controller Manual, https://nwhcoding.com/VehiclePhysics/manual/VehicleController.html
      129. What Sim Racers Get Wrong About Motion, Haptics, and Vibration, https://www.d-box.com/en/blog/d-box-blog-what-sim-racers-get-wrong-about-motion-haptics
      130. Expanding the Sensory Experience with Core Haptics - WWDC19, https://developer.apple.com/videos/play/wwdc2019/223/
      131. Effective Chase Cam Tracking On Loops - NEODRIVE by sevencrane, https://sevencrane.itch.io/neodrive/devlog/1328014/effective-chase-cam-tracking-on-loops
      132. The chase camera makes the physics look weird - Steam Community, https://steamcommunity.com/app/310560/discussions/0/483367798497556121/?l=vietnamese
      133. Recap: Chase Camera – Unity - Coddy Tech, https://coddy.tech/learn/unity/physics_and_gameplay/recap_chase_camera
      134. ELI5: how do racing games typically angle cameras to look as nice, https://www.reddit.com/r/explainlikeimfive/comments/fgxj43/eli5_how_do_racing_games_typically_angle_cameras/
      135. Building a car for Racer, http://www.racer.nl/tutorial/car_cameras.htm
      136. Sense of Speed: 1. FOV change based on speed 2. Camera Shake, https://www.reddit.com/r/Unity3D/comments/1i7ygiu/sense_of_speed_sense_of_speed_1_fov_change_based/
      137. Sim Racing FOV Guide: iRacing & ACC Calculator | SRP®, https://simracing-pro.com/sim-racing-fov-guide/
      138. FOV Calculator for Sim Racing - SIMRACINGCOCKPIT.GG, https://simracingcockpit.gg/fov-calculator/
      139. Vehicle Feel: 1. Add rotational Damping to the camera 2 ... - Reddit, https://www.reddit.com/r/Unity3D/comments/1ickzyl/vehicle_feel_1_add_rotational_damping_to_the/
      140. Integrating Interactive Car Engine Sounds in Games - BOOM Library, https://www.boomlibrary.com/blog/the-car-engine-sound-primer-mike-caviezel/
      141. Question about crossfade of engine sounds with limited number of, https://www.reddit.com/r/Unity3D/comments/1ntmsew/question_about_crossfade_of_engine_sounds_with/
      142. Realistic Skid Sound in UE5 – Detect Any Tire Slip | Part 16 - YouTube, https://www.youtube.com/watch?v=Ay-OOHg1l1o
      143. Haptic Feedback Defined: Types, Benefits & Uses - BairesDev, https://www.bairesdev.com/blog/your-app-needs-haptic-feedback/
      144. 6 Haptic Gaming Effects That Can Be Created Right Now, https://pages.boreas.ca/blog/piezo-haptics/6-haptic-gaming-effects-that-can-be-created-right-now
      145. GitHub - Acharad/RichHaptic: Unity haptics for iOS and Android with, https://github.com/Acharad/RichHaptic
      146. 10 Strategies to Optimize Physics in Mobile Games | daily.dev, https://daily.dev/blog/10-strategies-to-optimize-physics-in-mobile-games/
      147. 20 raycast, 3 spherecast or 1 capsulecast is the more expensive in, https://www.reddit.com/r/Unity3D/comments/11f90yg/20_raycast_3_spherecast_or_1_capsulecast_is_the/
      148. "Wheel Colliders suck, I'll make my own" : r/Unity3D - Reddit, https://www.reddit.com/r/Unity3D/comments/1k40gad/wheel_colliders_suck_ill_make_my_own/
      149. Testing raycast car vs shapecast car : r/godot - Reddit, https://www.reddit.com/r/godot/comments/1ksw4ir/testing_raycast_car_vs_shapecast_car/