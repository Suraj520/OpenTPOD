import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Formik } from "formik";
import URI from "urijs";
import ReactPaginate from "react-paginate";
import AsyncPaginate from "react-select-async-paginate";
import {
    Button,
    Card,
    Dimmer,
    Grid,
    Page,
    List,
    Form,
    FormTextInput,
    FormCard
} from "tabler-react";
import SiteWrapper from "./SiteWrapper.react";
import { endpoints } from "./url";
import { fetchJSON, lineWrap, downloadByPoll as checkDownload } from "./util";
import defaultStrings from "./DetectorPage.strings";
import { loadAndSearchTasks } from "./DetectorForm.react";
import "./App.css";

const fetchDetector = id => {
    /* Get detector json from backend*/
    let url = URI.joinPaths(endpoints.detectors, id);
    return fetchJSON(url, "GET");
};

// detector card to display detector information
const DetectorPreviewCard = ({ detector, onDelete, ...rest }) => {
    // null - no download
    // false - created downloading job
    // true - job avalable for download
    const [downloadAvailable, setDownloadAvailable] = useState(null);
    let history = useHistory();
    let downloadUrl = URI.joinPaths(
        endpoints.detectors,
        detector.id.toString(),
        endpoints.detectorDownloadField
    );
    return (
        <Card>
            <Card.Header>
                <Card.Title>{lineWrap(detector.name)}</Card.Title>
                <Card.Options>
                    <Button
                        outline
                        RootComponent="button"
                        color="primary"
                        size="sm"
                        icon="tag"
                        onClick={e => {
                            e.preventDefault();
                            history.push(
                                URI.joinPaths(
                                    endpoints.uiDetector,
                                    detector.id.toString()
                                ).toString()
                            );
                        }}
                    >
                        Details
                    </Button>
                    {detector.status == "trained" && (
                        <Button
                            outline
                            color="info"
                            size="sm"
                            icon="download"
                            onClick={e => {
                                e.preventDefault();
                                setDownloadAvailable(false);
                                fetchJSON(downloadUrl, "POST").then(() => {
                                    // need to continuously fetch the server
                                    checkDownload(
                                        downloadUrl,
                                        10000,
                                        1200000,
                                        resp => {
                                            setDownloadAvailable(true);
                                        },
                                        () => {}
                                    );
                                });
                            }}
                        ></Button>
                    )}
                    <Button
                        outline
                        RootComponent="button"
                        color="danger"
                        size="sm"
                        icon="trash"
                        method="delete"
                        onClick={e => {
                            e.preventDefault();
                            fetchJSON(
                                URI.joinPaths(
                                    endpoints.detectors,
                                    detector.id.toString()
                                ),
                                "DELETE"
                            ).then(onDelete());
                        }}
                    ></Button>
                </Card.Options>
            </Card.Header>
            <Card.Body>
                {downloadAvailable === null ? (
                    <>
                        <b>Status:</b> {detector.status} <br />
                        <b>Created Date:</b> {detector.created_date} <br />
                        <b>Updated Date:</b> {detector.updated_date} <br />
                    </>
                ) : downloadAvailable === false ? (
                    <Dimmer active loader />
                ) : (
                    <Button
                        color="primary"
                        RootComponent="a"
                        href={downloadUrl}
                    >
                        Click to Download
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

// detailed detector view with all of its field
const DetectorDetailCard = ({ detector }) => {
    let visualizationUrl = URI.joinPaths(
        endpoints.detectors,
        detector.id.toString(),
        endpoints.detectorVisualizationField
    );
    return (
        <Card>
            <Card.Header>
                <Card.Title>{lineWrap(detector.name)}</Card.Title>
                <Card.Options>
                    <Button
                        outline
                        RootComponent="button"
                        color="success"
                        size="sm"
                        icon="tag"
                        onClick={e => {
                            e.preventDefault();
                            fetchJSON(visualizationUrl, "POST").then(resp => {
                                setTimeout(() => {
                                    window.open(
                                        endpoints.tensorboard,
                                        "_blank"
                                    );
                                }, 2000);
                            });
                        }}
                    >
                        Visualize
                    </Button>
                </Card.Options>
            </Card.Header>
            <Card.Body>
                <b>Status:</b> {detector.status} <br />
                <b>DNN Type:</b> {detector.dnn_type} <br />
                <b>Created Date:</b> {detector.created_date} <br />
                <b>Updated Date:</b> {detector.updated_date} <br />
                <b>Training Set:</b>
                <pre id="json">
                    {" "}
                    {JSON.stringify(detector.train_set, undefined, 2)}{" "}
                </pre>
                <br />
                <b>Training Config:</b>
                <pre id="json"> {detector.train_config} </pre>
                <br />
            </Card.Body>
        </Card>
    );
};

// a list of detectors cards
const DetectorCards = ({ detectors, ...rest }) => {
    let cards = detectors.map((item, index) => {
        return (
            <Grid.Col auto key={index} sm={6}>
                <DetectorPreviewCard detector={item} {...rest} />
            </Grid.Col>
        );
    });
    return <>{cards}</>;
};

const DetectorPage = ({ ...props }) => {
    let history = useHistory();
    const [detectors, setDetectors] = useState(null);

    const loadDetectors = () => {
        setDetectors(null);
        fetchJSON(endpoints.detectors, "GET").then(resp => {
            setDetectors(resp);
        });
    };

    useEffect(() => {
        loadDetectors();
    }, []);

    return (
        <SiteWrapper>
            <Page.Content>
                <Page.Header
                    title="Detectors"
                    options={<Form.Input icon="search" placeholder="Search" />}
                ></Page.Header>
                {detectors == null ? (
                    <Dimmer active loader />
                ) : (
                    <Grid>
                        <Grid.Row alignItems="top">
                            <Grid.Col>
                                <Button
                                    RootComponent="button"
                                    color="primary"
                                    size="lg"
                                    icon="plus"
                                    onClick={e => {
                                        e.preventDefault();
                                        history.push(endpoints.uiDetectorNew);
                                    }}
                                >
                                    Create
                                </Button>
                            </Grid.Col>
                            <Grid.Col offset={8}>
                                <ReactPaginate
                                    previousLabel={"<"}
                                    nextLabel={">"}
                                    breakLabel={"..."}
                                    pageCount={Math.ceil(
                                        detectors.count /
                                            detectors.results.length
                                    )}
                                    marginPagesDisplayed={1}
                                    pageRangeDisplayed={2}
                                    // onPageChange={this.handlePageClick}
                                    onPageChange={() => {}}
                                    containerClassName={
                                        "pagination react-paginate"
                                    }
                                    subContainerClassName={
                                        "pages pagination react-paginate"
                                    }
                                    pageLinkClassName={
                                        "list-group-item list-group-item-action"
                                    }
                                    previousLinkClassName={
                                        "list-group-item list-group-item-action"
                                    }
                                    nextLinkClassName={
                                        "list-group-item list-group-item-action"
                                    }
                                    breakLinkClassName={
                                        "list-group-item list-group-item-action"
                                    }
                                    activeClassName={"active"}
                                />
                            </Grid.Col>
                        </Grid.Row>
                        <Grid.Row>
                            <DetectorCards
                                detectors={detectors.results}
                                onDelete={loadDetectors}
                                {...props}
                            />
                        </Grid.Row>
                    </Grid>
                )}
            </Page.Content>
        </SiteWrapper>
    );
};

const DetectorDetailPage = ({ props }) => {
    /* Detailed Page for Detectors*/
    const [detector, setDetector] = useState(null);

    let { id } = useParams();
    let history = useHistory();

    const loadResource = () => {
        setDetector(null);
        fetchDetector(id).then(detector => {
            setDetector(detector);
        });
    };

    useEffect(() => {
        loadResource();
    }, []);

    return (
        <SiteWrapper>
            <Page.Content>
                <Page.Header
                    title="Detector"
                    options={
                        <Button
                            outline
                            RootComponent="button"
                            color="primary"
                            size="md"
                            onClick={e => {
                                e.preventDefault();
                                history.goBack();
                            }}
                        >
                            Back
                        </Button>
                    }
                ></Page.Header>
                {detector == null ? (
                    <Dimmer active loader />
                ) : (
                    <Grid>
                        <Grid.Row>
                            <DetectorDetailCard detector={detector} />
                        </Grid.Row>
                    </Grid>
                )}
            </Page.Content>
        </SiteWrapper>
    );
};

const DetectorNewForm = props => {
    const [selectValue, onSelectValueChange] = useState(null);
    const [numberOfRequests, setNumberOfRequests] = useState(0);

    const {
        action,
        method,
        onSubmit,
        onChange,
        onBlur,
        values,
        strings = {},
        errors
    } = props;

    return (
        <FormCard
            buttonText={strings.buttonText || defaultStrings.buttonText}
            title={strings.title || defaultStrings.title}
            onSubmit={onSubmit}
            action={action}
            method={method}
        >
            <FormTextInput
                name="name"
                label={strings.nameLabel || defaultStrings.nameLabel}
                placeholder={
                    strings.namePlaceholder || defaultStrings.namePlaceholder
                }
                onChange={onChange}
                onBlur={onBlur}
                value={values && values.name}
                error={errors && errors.name}
            />
            <FormTextInput
                name="Training Configurations"
                label={strings.emailLabel || defaultStrings.emailLabel}
                placeholder={
                    strings.emailPlaceholder || defaultStrings.emailPlaceholder
                }
                onChange={onChange}
                onBlur={onBlur}
                value={values && values.email}
                error={errors && errors.email}
            />
            <AsyncPaginate
                debounceTimeout={300}
                value={selectValue}
                initialOptions={[]}
                loadOptions={loadAndSearchTasks}
                onChange={onSelectValueChange}
                isMulti
                closeMenuOnSelect={false}
                additional={{
                    page: 1
                }}
            />
            <FormTextInput
                name="password"
                type="password"
                label={strings.passwordLabel || defaultStrings.passwordLabel}
                placeholder={
                    strings.passwordPlaceholder ||
                    defaultStrings.passwordPlaceholder
                }
                onChange={onChange}
                onBlur={onBlur}
                value={values && values.password}
                error={errors && errors.password}
            />
            {/* <FormCheckboxInput
                onChange={onChange}
                onBlur={onBlur}
                value={values && values.terms}
                name="terms"
                label={strings.termsLabel || defaultStrings.termsLabel}
            /> */}
        </FormCard>
    );
};

const DetectorNewPage = ({ ...props }) => {
    return (
        <SiteWrapper>
            <Page.Content>
                <Page.Header title="New Detector"></Page.Header>
                <Grid>
                    <Formik
                        initialValues={{
                            email: "",
                            password: ""
                        }}
                        validate={values => {
                            // same as above, but feel free to move this into a class method now.
                            let errors = {};
                            if (!values.email) {
                                errors.email = "Required";
                            } else if (
                                !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(
                                    values.email
                                )
                            ) {
                                errors.email = "Invalid email address";
                            }
                            return errors;
                        }}
                        onSubmit={(
                            values,
                            {
                                setSubmitting,
                                setErrors /* setValues and other goodies */
                            }
                        ) => {
                            alert("Done!");
                        }}
                        render={({
                            values,
                            errors,
                            touched,
                            handleChange,
                            handleBlur,
                            handleSubmit,
                            isSubmitting
                        }) => (
                            <DetectorNewForm
                                onSubmit={handleSubmit}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                values={values}
                                errors={errors}
                                touched={touched}
                            />
                        )}
                    />
                </Grid>
            </Page.Content>
        </SiteWrapper>
    );
};

export { DetectorPage, DetectorDetailPage, DetectorNewPage };
